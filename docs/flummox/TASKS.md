# Tasks: Flummox! (page 152)

Ordered build tasks for [PLAN.md](./PLAN.md). Each lists what's done when it's done. Run the usual checks before every push: lint, validate, typecheck, tests, build, Storybook build, Playwright.

## Checkpoint 1: content and Felix

- [x] **T1. Quiz schema and file.** Add `src/content/flummox/schema.ts` and `quiz.json` with 12 draft questions (SPEC §11, Q1) and the verdicts. *Done when* the types compile and the file loads.
- [x] **T2. Quiz validation.** Implement the six rules in SPEC §7 and run them from `npm run validate` and the content plugin. *Done when* each rule has a failing Vitest fixture with a clear message naming the question.
- [x] **T3. Run-time placeholders.** Let the compiler keep `{score}`, `{question}`, `{total}` and `{checkpoint}` as fixed-width segments that the app fills in (built as `{slot:NAME}`: score, best, resume, point, newbest). *Done when* a compiled screen can be filled without re-wrapping and the width is unchanged.
- [x] **T4. Screen builder.** `src/content/flummox/screens.ts` builds the intro, question, correct, flummoxed, checkpoint and finished screens through `compile.ts`, served as `virtual:flummox`. *Done when* every screen for every question passes the grid checks at 38 and 32 columns.
- [x] **T5. Felix.** Draw `felix.png` and `felix-flummoxed.png` (both sizes) as pixel art. *Done when* they pass the two-colours-a-cell check and Steve has seen them.
- [x] **T6. Page 152 and the index.** Add `page152.json` (intro), the `Flummox!.....152` line on page 100 and the quick index entry. *Done when* /152/ pre-renders and the index fits in every mode.
- [x] **T7. Storybook.** A story per screen type, in all three modes. *Done when* Storybook builds.

**Review with Steve:** screenshots of every screen; question edits.

## Checkpoint 2: playable

- [x] **T8. Game reducer.** `src/flummox/game.ts` with `play`, `answer`, `next`, `retry`, `restart` (SPEC §5 and §6). *Done when* unit tests cover scoring, checkpoints, re-asked questions scoring nothing, restart and finishing.
- [x] **T9. Storage.** `useFlummox` saving the game to `sessionStorage` and the best score per edition to `localStorage` under `steevefax:flummox`. *Done when* tests cover missing and throwing storage, and a new edition starts a new best.
- [x] **T10. Fastext actions.** `FastTextBar` and `MobileKeypad` accept a page link, an action, or an answer key per slot; answer keys draw as solid colour blocks with names like "Red: BBC One". *Done when* existing Fastext tests still pass and new ones cover both new kinds.
- [x] **T11. App wiring.** On 152 the body, Fastext and mirror come from the game screen; `R`/`G`/`Y`/`B`/`C` and the remote answer on a question; digits still navigate. *Done when* a full game can be played by keyboard and by the remote.
- [x] **T12. Clickable answers.** Answer lines in the grid answer on click or tap, never taking focus. *Done when* a game can be played with the mouse alone.
- [x] **T13. Share message and links.** `src/flummox/share.ts` builds the message and the share URL for Bluesky, X, Threads, Facebook, LinkedIn, WhatsApp and email (SPEC §6, Sharing). *Done when* unit tests cover each URL and the encoding.
- [ ] **T14. Share and Copy.** Share on the Finished screen uses the native share sheet when there is one, otherwise the Share screen; Copy uses the clipboard with a fallback; Save picture and Share picture lines. *Done when* both paths work in a browser.
- [x] **T14a. Score pages and per-page previews.** Pre-render `/152/score/0/` to `/12/` with their own title, description, `og:url`, image and alt text, `noindex`, and canonical to /152/; per-page `og:image:alt` everywhere; the app sends score pages on to /152/. *Done when* the built HTML for /152/ and every score page has the right tags (Vitest over `dist`), and opening a score page lands on /152/.
- [x] **T14b. Share cards.** The `/` block glyph, the `FlummoxCard` story, `npm run share-images`, the "Update share images" workflow, the 14 committed PNGs (each under 300 KB) and the staleness check. *Done when* the images are committed from CI and the check fails if a verdict changes.

**Review with Steve:** play it on a preview build, share a score, and look at the 14 cards. After merge: check the previews with Facebook's Sharing Debugger, LinkedIn's Post Inspector and a Bluesky post.

## Checkpoint 3: accessible and shipped

- [ ] **T15. Mirror.** The `answers` block of four buttons, Felix's alt text, result headings, and the `answer-N` focus twin (SPEC §9). *Done when* axe passes on a question and a result screen.
- [ ] **T16. Focus and announcements.** Focus to the result heading after an answer and to the next question's heading after Next or Try again; live-region messages. *Done when* tested in Vitest.
- [ ] **T17. Text mode and shortcuts off.** *Done when* a game can be played in Text mode and with shortcuts off, using Tab and Enter.
- [ ] **T18. No-JavaScript fallback.** The pre-rendered /152/ says the quiz needs JavaScript. *Done when* checked in the built HTML.
- [ ] **T19. Playwright.** The journeys in PLAN §7, plus screenshots of the intro, a question and the Flummoxed screen at four sizes; baselines from the workflow. *Done when* CI is green.
- [ ] **T20. Docs.** README section "Updating the Flummox! questions"; mark the spec as built and record any decisions taken during the build in its log. *Done when* merged with the build PR.
