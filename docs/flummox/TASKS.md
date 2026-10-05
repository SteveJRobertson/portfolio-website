# Tasks: Flummox! (page 152)

Ordered build tasks for [PLAN.md](./PLAN.md). Each lists what's done when it's done. Run the usual checks before every push: lint, validate, typecheck, tests, build, Storybook build, Playwright.

## Checkpoint 1: content and Felix

- [ ] **T1. Quiz schema and file.** Add `src/content/flummox/schema.ts` and `quiz.json` with 12 draft questions (SPEC §11, Q1) and the verdicts. *Done when* the types compile and the file loads.
- [ ] **T2. Quiz validation.** Implement the six rules in SPEC §7 and run them from `npm run validate` and the content plugin. *Done when* each rule has a failing Vitest fixture with a clear message naming the question.
- [ ] **T3. Run-time placeholders.** Let the compiler keep `{score}`, `{question}`, `{total}` and `{checkpoint}` as fixed-width segments that the app fills in. *Done when* a compiled screen can be filled without re-wrapping and the width is unchanged.
- [ ] **T4. Screen builder.** `src/content/flummox/screens.ts` builds the intro, question, correct, flummoxed, checkpoint and finished screens through `compile.ts`, served as `virtual:flummox`. *Done when* every screen for every question passes the grid checks at 38 and 32 columns.
- [ ] **T5. Felix.** Draw `felix.png` and `felix-flummoxed.png` (both sizes) as pixel art. *Done when* they pass the two-colours-a-cell check and Steve has seen them.
- [ ] **T6. Page 152 and the index.** Add `page152.json` (intro), the `Flummox!.....152` line on page 100 and the quick index entry. *Done when* /152/ pre-renders and the index fits in every mode.
- [ ] **T7. Storybook.** A story per screen type, in all three modes. *Done when* Storybook builds.

**Review with Steve:** screenshots of every screen; question edits.

## Checkpoint 2: playable

- [ ] **T8. Game reducer.** `src/flummox/game.ts` with `play`, `answer`, `next`, `retry`, `restart` (SPEC §5 and §6). *Done when* unit tests cover scoring, checkpoints, re-asked questions scoring nothing, restart and finishing.
- [ ] **T9. Storage.** `useFlummox` saving the game to `sessionStorage` and the best score per edition to `localStorage` under `steevefax:flummox`. *Done when* tests cover missing and throwing storage, and a new edition starts a new best.
- [ ] **T10. Fastext actions.** `FastTextBar` and `MobileKeypad` accept a page link, an action, or an answer key per slot; answer keys draw as solid colour blocks with names like "Red: BBC One". *Done when* existing Fastext tests still pass and new ones cover both new kinds.
- [ ] **T11. App wiring.** On 152 the body, Fastext and mirror come from the game screen; `R`/`G`/`Y`/`B`/`C` and the remote answer on a question; digits still navigate. *Done when* a full game can be played by keyboard and by the remote.
- [ ] **T12. Clickable answers.** Answer lines in the grid answer on click or tap, never taking focus. *Done when* a game can be played with the mouse alone.

**Review with Steve:** play it on a preview build.

## Checkpoint 3: accessible and shipped

- [ ] **T13. Mirror.** The `answers` block of four buttons, Felix's alt text, result headings, and the `answer-N` focus twin (SPEC §9). *Done when* axe passes on a question and a result screen.
- [ ] **T14. Focus and announcements.** Focus to the result heading after an answer and to the next question's heading after Next or Try again; live-region messages. *Done when* tested in Vitest.
- [ ] **T15. Text mode and shortcuts off.** *Done when* a game can be played in Text mode and with shortcuts off, using Tab and Enter.
- [ ] **T16. No-JavaScript fallback.** The pre-rendered /152/ says the quiz needs JavaScript. *Done when* checked in the built HTML.
- [ ] **T17. Playwright.** The journeys in PLAN §6, plus screenshots of the intro, a question and the Flummoxed screen at four sizes; baselines from the workflow. *Done when* CI is green.
- [ ] **T18. Docs.** README section "Updating the Flummox! questions"; mark the spec as built and record any decisions taken during the build in its log. *Done when* merged with the build PR.
