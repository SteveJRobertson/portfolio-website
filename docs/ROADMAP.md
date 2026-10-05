# Roadmap: Teletext Portfolio

Remediation of the Gemini build. Each phase ships as its own PR. Background is in [REVIEW.md](./REVIEW.md) and requirements are in [SPEC.md](./SPEC.md).

| Phase | Status |
|---|---|
| 0. Honest docs | Done |
| 1. Foundations | Done |
| 2. Grid engine | Done |
| 3. Content pipeline | Done |
| 4. Navigation & accessibility | Done |
| 5. Graphics & polish | Done |
| 6. Ship | In review |

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
- [x] Fastext as `<a href>`; hotkeys R/G/Y/B (C also works for the fourth)
- [x] Shared digit buffer for keyboard and keypad; fix the side effect inside the state updater
- [x] Nothing focusable inside `aria-hidden`; full semantic mirror built from the logical rows
- [x] Live-region announcements + focus management on navigation; skip link; grid twin outline
- [x] Page 888 Text mode (persisted) and a shortcuts off switch
- [x] axe checks in CI (Vitest + axe-core, every page, both views)

### Phase 5: Graphics & polish
- [x] Build-time image → 2×3 mosaic converter (PNG in `src/content/images/`, image rows in the page JSON, validated)
- [x] Page 101: a cartoon portrait of Steve as pixel art, with his summary beside it (101 is now two sub-pages)
- [ ] Optional edit.tf import (deferred until there's artwork, DEC-013)
- [x] CRT scanline/glow overlay, off at first with reduced motion or more contrast, with a switch on 888
- [x] Sub-page cycling every 15 seconds with HOLD (H key, strip button, keypad)

### Phase 6: Ship
- [x] Per-page pre-rendered HTML + meta tags (title, description, canonical, Open Graph with a share image)
- [x] Vite `base`, `404.html` for unknown URLs
- [x] Storybook published at `/storybook`
- [x] Playwright tests at four viewports: navigation, axe with contrast, screenshots
- [x] Deploy to GitHub Pages after CI passes on `main`
- [x] Black letters on the magenta and cyan banners, with a 3:1 banner contrast test
