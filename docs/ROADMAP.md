# Roadmap: Teletext Portfolio

Remediation of the Gemini build. Each phase ships as its own PR. Background is in [REVIEW.md](./REVIEW.md) and requirements are in [SPEC.md](./SPEC.md).

| Phase | Status |
|---|---|
| 0. Honest docs | Done |
| 1. Foundations | Done |
| 2. Grid engine | Done |
| 3. Content pipeline | In review |
| 4. Navigation & accessibility | Not started |
| 5. Graphics & polish | Not started |
| 6. Ship | Deferred (private repo) |

---

### Phase 0: Honest docs
- [x] `docs/REVIEW.md` (findings + plan)
- [x] Rewrite `docs/SPEC.md` to match the brief and the PO decisions
- [x] Rewrite this roadmap with honest status
- [x] Remove Gemini agent rules (`.agents/`) and Vite template leftovers
- [x] Replace the template README
- [x] `docs/CONTENT.md` content brief from the current site

### Phase 1: Foundations
- [x] Self-host Bedstead WOFF2 (v002.002, CC0, includes U+1FB00 mosaics); remove Google Fonts
- [x] Remove `user-scalable=no` / `maximum-scale` from the viewport meta
- [x] Add Vitest with an `npm test` script (validator, page buffer, Fastext, contrast)
- [x] Add Storybook with token and primitive stories
- [x] Fix the CI typecheck (`tsc -b`), add lint and test steps (`ci.yml` on every PR); deploy made manual-only

### Phase 2: Grid engine
- [x] `<TeletextGrid cols rows>` that renders exact cells
- [x] One aspect-ratio switch (`src/display/gridModes.ts`, applied through `data-mode`): 56×24 / 40×24 / 20×36; JS width check removed
- [x] `min()` font sizing, zero scroll, safe-area insets
- [x] Header and Fastext as fixed grid rows; data-driven sidebar
- [x] Double-height rows
- [x] Pages 202 and 404 render through the grid (still in code until Phase 3)
- [x] Stop-gap portrait word wrap (removed by the Phase 3 build-time wrapper)

### Phase 3: Content pipeline
- [x] Single typed schema + single page registry
- [x] Colour-tag markup + build-time wrapper (38 and 20 columns, as a Vite plugin), `mobileRows` override
- [x] Validator: width, row count, link targets, colour tags, file names
- [x] 404 moved into content; 110, 203 and 888 added; 202 is now Lighthouse Compare (canvas demo dropped)
- [x] New copy from [CONTENT.md](./CONTENT.md)
- [x] Manual sub-page stepping (←/→ and keypad) until Phase 5 cycling

### Phase 4: Navigation & accessibility
- [ ] Fastext as `<a href>`; hotkeys R/G/Y/B
- [ ] Shared digit buffer for keyboard and keypad; fix the side effect inside the state updater
- [ ] Nothing focusable inside `aria-hidden`; full semantic mirror
- [ ] Live-region announcements + focus management on navigation
- [ ] Page 888 Text mode (persisted)
- [ ] axe checks in CI

### Phase 5: Graphics & polish
- [ ] Build-time image → 2×3 mosaic converter (text output)
- [ ] Optional edit.tf import
- [ ] Scanline/glow overlay that respects reduced motion, with a toggle on 888
- [ ] Sub-page cycling with hold

### Phase 6: Ship (deferred)
- [ ] Per-page pre-rendered HTML + meta tags
- [ ] Vite `base`, `404.html` SPA fallback
- [ ] Storybook published at `/storybook`
- [ ] Playwright visual tests at four viewports
