# Roadmap: Teletext Portfolio

Remediation of the Gemini build. Each phase ships as its own PR. Background is in [REVIEW.md](./REVIEW.md) and requirements are in [SPEC.md](./SPEC.md).

| Phase | Status |
|---|---|
| 0. Honest docs | In review |
| 1. Foundations | Not started |
| 2. Grid engine | Not started |
| 3. Content pipeline | Not started |
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
- [ ] Self-host Bedstead WOFF2; remove Google Fonts
- [ ] Remove `user-scalable=no` / `maximum-scale` from the viewport meta
- [ ] Add Vitest with an `npm test` script
- [ ] Add Storybook with token and primitive stories
- [ ] Fix the CI typecheck (`tsc -b`), add lint and test steps

### Phase 2: Grid engine
- [ ] `<TeletextGrid cols rows>` that renders exact cells
- [ ] One CSS aspect-ratio switch: 56×24 / 40×24 / 20×36; remove the JS widescreen check
- [ ] `min()` font sizing, zero scroll, safe-area insets
- [ ] Header and Fastext as fixed grid rows; data-driven sidebar
- [ ] Double-height rows

### Phase 3: Content pipeline
- [ ] Single typed schema + single page registry
- [ ] Colour-tag markup + build-time wrapper (38/40 and 20 columns), `mobileRows` override
- [ ] Validator: width, row count, link targets, colour tags
- [ ] Move 202 and 404 into content; add 888 and 203 (or drop 203)
- [ ] New copy from [CONTENT.md](./CONTENT.md)

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
