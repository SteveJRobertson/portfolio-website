# Plan: Flummox! (page 152)

How [SPEC.md](./SPEC.md) gets built. Task-by-task steps are in [TASKS.md](./TASKS.md).

## Delivery

One branch and one PR for the build, squash-merged after Steve approves, as with the v1 phases. This docs PR comes first; the build starts once Steve says go. The build PR is reviewed in three checkpoints (below), each with screenshots at the four Playwright sizes plus iPhone Safari's portrait viewport (390 × 664).

## Architecture

### 1. Content: `quiz.json` → compiled screens (build time)

- `src/content/flummox/quiz.json` holds the edition (SPEC §7).
- `src/content/flummox/schema.ts` defines its types and allowed keys, next to `src/content/schema.ts`.
- `src/content/flummox/screens.ts` turns the quiz into screen sources: for each question, a list of `RowSource`s (banner, question line, Felix image row with the question `beside` it, four answer rows), plus the intro, correct, flummoxed, checkpoint and finished screens. They go through the existing compiler (`compile.ts`), so wrapping at 38 and 32 columns, the semantic mirror and the grid-size checks all come for free.
- Numbers that change while playing (score, question number, "back to question N") are written as fixed-width placeholders, e.g. `{score}`, that the compiler keeps as their own segment, and the app fills in at run time. Their width is fixed (two digits), so a screen that fits at build time always fits.
- The content plugin (`scripts/lib/contentPlugin.ts`) serves the compiled quiz as `virtual:flummox`, and `validatePages.ts` runs the quiz checks (SPEC §7) alongside the page checks.

### 2. Page 152 in the registry

- `src/content/pages/page152.json` gives 152 its title, label, description and the intro screen, so the router, quick index, pre-render and no-JavaScript fallback treat it like any other page.
- Page 100 gets a `Flummox!.....152` directory line.

### 3. Felix (pixel art)

- `src/content/images/felix.png` and `felix-flummoxed.png`, drawn at 2 × 3 pixels a cell in palette colours, two colours a cell (v1 §8), checked by the existing validator. A small size for questions (about 8 × 6 cells) and a larger one for the intro (about 12 × 9).
- Both get alt text (SPEC §9).

### 4. Game state (run time)

- `src/flummox/game.ts`: a pure reducer, so every rule is unit tested without React. State is `{ edition, screen, question, checkpoint, score, answered[] }`; actions are `play`, `answer(slot)`, `next`, `retry`, `restart`.
- `src/flummox/useFlummox.ts`: the hook around it, saving the game to `sessionStorage` and the best score to `localStorage` (SPEC §6), with the same try/catch fallbacks as `useSettings`.

### 5. Wiring into the app

- `App.tsx`: when the page is 152, the body rows, Fastext and mirror come from the current game screen rather than the page's compiled rows. The rest of the app (header, digit buffer, quick index, settings) is unchanged.
- Fastext: `FastTextBar` and `MobileKeypad` take an optional per-slot action, so a slot can be a page link (as now), an action button ("Play", "Next"), or an answer key drawn as a solid colour block.
- `useHotkeys`: `onFastext(slot)` already exists; on 152 it calls the game instead of `navigate`.
- `GridLine`: answer rows are clickable like grid links, with a new twin id `answer-N` so focusing a mirror button outlines its line.
- `SemanticPage`: a new `answers` block kind renders the four buttons; a heading block for the result screens takes focus after an answer.

### 6. Sharing

- `src/flummox/share.ts`: builds the message from `quiz.json`'s wording and the score, and the share URL for each network (SPEC §6, Sharing). Pure functions, unit tested, URL-encoded.
- The Share action tries `navigator.share` and falls back to the Share screen; Copy uses `navigator.clipboard.writeText` with a fallback message.
- The Share screen's network lines are grid links to external addresses, reusing the `href` segments that email and web addresses already use (they open in a new tab and have real links in the mirror).
- `scripts/prerender.ts` gives /152/ its own Open Graph image, `public/share-152.png`, taken by `e2e/shareImage.ts` like the site's share image.

### 7. Tests

- Vitest: the reducer (scoring, checkpoints, retry, restart, re-asked questions scoring nothing, finishing), quiz validation (each rule in SPEC §7 has a failing fixture), storage fallbacks, share URLs and message for each network (including encoding and the score), Fastext labels in answer mode, hotkeys answering on 152 only.
- Vitest + axe: the mirror for a question and a result screen.
- Playwright: play a whole game by keyboard (including a wrong answer and a checkpoint), play by clicking answer lines, play in Text mode with Tab and Enter, leave mid-game and come back, finish and open the Share screen (with `navigator.share` stubbed out) and check each link. Screenshots of the intro, a question and the Flummoxed screen at the four sizes, with baselines from the "Update visual baselines" workflow.

## Checkpoints for Steve

1. **Content and Felix**: `quiz.json` with the draft questions, Felix in both moods, and screenshots of every screen type (not yet playable). Steve edits questions here.
2. **Playable**: the full game by keyboard, mouse and remote, scoring, best score and sharing.
3. **Accessible and shipped**: mirror, Text mode, focus, e2e tests and baselines; CI green, ready to merge.

## Risks

| Risk | Mitigation |
|---|---|
| A long question or answer overflows portrait | Build-time checks per screen per mode (SPEC §7, rules 3 and 4), with the error naming the question. |
| Fastext changing meaning on one page confuses people | The answer keys are drawn as plain colour blocks, never page labels, and the hint row says "Press a coloured button to answer". Digits always leave. |
| Felix at 8 × 6 cells doesn't read as a face | Draw him first and review at checkpoint 1 before wiring the game. |
| Focus jumps feel abrupt for screen readers | Focus goes to a heading that names the result, the same pattern as page changes. |
