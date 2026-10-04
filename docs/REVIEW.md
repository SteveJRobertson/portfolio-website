# Code Review: Gemini Build vs Original Brief

**Date**: 4 October 2026
**Scope**: Every commit up to `957277d` ("Sprint 5"), compared against the original brief and the agreed spec from the Gemini discovery chat.
**Method**: Read all of the source, ran `npm ci`, `npm run build` and `npm run lint`, then served `dist/` and screenshotted `/`, `/202` and `/888` at 1920×1080, 1440×900, 1024×768 and 390×844 using headless Chromium.

## Summary

The visual direction is a good starting point: the palette, header, Fastext colours and widescreen sidebar all look right. The implementation is mostly a mock-up, though. Many of the brief's hard requirements are missing or faked, and the old `docs/ROADMAP.md` marked all of them as complete.

**Worth keeping**: the Vite + React + TypeScript scaffold, the colour tokens, the JSON-per-page content idea, the CI workflow skeleton and the overall look.

**Needs rebuilding**: the grid/display engine, the content pipeline, navigation state and accessibility.

---

## 1. Claimed as done, but not delivered

| Claim | Finding |
|---|---|
| Bedstead font | `public/fonts/bedstead.woff2` doesn't exist. The browser reports `Bedstead: error` and falls back to a generic monospace font. Vite warns about the unresolved URL at build time. |
| Page 888 accessibility / reader mode | No page exists. `/888` is in `VALID_PAGES` but has no content file, so it renders the 404 "SIGNAL LOST" screen. |
| Page 203 | Listed on page 200 but doesn't exist. |
| Image → Teletext mosaic (2×3 sixels) | `TeletextCanvasImage` only shrinks an image and maps it to the 8 colours as big square pixels. It doesn't produce 2×3 mosaic characters, isn't aligned to the character grid, and the only demo image is `favicon.svg`. |
| Auto word-wrapping markup parser | Doesn't exist. Every content row is padded by hand. |
| Storybook design system | Not installed, no stories. |
| Pre-rendered HTML for SEO / social cards | Not built. There is one `index.html` with one static set of meta tags. |
| Ready for GitHub Pages | Vite `base` isn't set, so assets would 404 under `/<repo>/`. There's no `404.html` SPA fallback, so a direct visit to `/101` would hit GitHub's 404. |
| Dual-tree accessibility | See section 3. |
| "Responsive cross-browser verification" | The phone layout overflows horizontally (see section 2). |

## 2. Requirements dropped or changed without sign-off

- **Mobile 20×36 matrix**: agreed in the brief to avoid scrolling and tiny text. The Gemini SPEC replaced it with a "scaled 40×24 stage plus handheld remote" without a decision record. At 390×844 the font is about 14px, the title row is clipped, and the cyan Fastext button is pushed off-screen.
- **Strict character grid**: rows aren't fixed at 24. The body is a flex column with `gap: 0.15em` and padding, so row positions drift. The header and Fastext bar aren't aligned to the columns. At 1024×768 the Fastext bar spills past the screen border.
- **Widescreen detection is in two places that disagree**: JS uses `width ≥ 1024 && ratio ≥ 1.5`, CSS uses `min-width: 1024px and min-aspect-ratio: 16/10`. For ratios between 1.5 and 1.6 the sidebar renders inside a 40-column screen.
- **Fastext**: blue/cyan is bound to `C`, plus an undocumented `B`. The buttons are `<button>`s with click handlers rather than real links with `href`s, which the brief specifically recommended.
- **Not implemented at all**: CRT scanline overlay with an off toggle, the TV/Text-mode toggle, cycling sub-pages, and row-count validation (the validator only checks width, and only at 38 columns).

## 3. Accessibility defects

- The entire visual tree, including the Fastext buttons and the remote handset, sits inside `aria-hidden="true"` but is still focusable. That's an ARIA violation: focus lands on elements screen readers can't see.
- The `.sr-only` tree only lists 5 pages (no 201/202/888), shows no contact links, and doesn't announce page changes or move focus on navigation.
- `<meta name="viewport" … maximum-scale=1.0, user-scalable=no>` blocks pinch-zoom (WCAG 1.4.4 Resize Text).
- The hover style on Fastext buttons is the same as the focus style, so the focus indicator isn't distinct.

## 4. Code quality

- `App.tsx` hard-codes the sidebar row by row (`idx === 3 && …`), and pages 202 and 404 are written straight into JSX instead of content files.
- The list of valid pages is duplicated in `usePageBuffer.ts`, `MobileKeypad.tsx` and `pageRegistry.ts`, and the copies disagree (the root cause of the 888 bug).
- `usePageBuffer` calls `setTimeout(navigate)` inside a `setState` updater. StrictMode double-invokes updaters in dev, so it can navigate twice.
- The keyboard and the on-screen keypad keep separate digit buffers.
- `.teletext-row` is defined twice in `index.css`.
- Leftovers from the Vite template: `src/App.css` (not imported), `src/assets/*` (unused), the template README.
- No tests. In CI, `npx tsc --noEmit` runs against the solution-style root `tsconfig.json`, so it doesn't typecheck the app (`npm run build` does, via `tsc -b`).

## 5. Content

The current copy is placeholder text and partly made up. For example, "Google Antigravity Agent SDK", "Storybook 8, Vitest" (neither is used here) and "over a decade of experience". There's no LinkedIn or email. All content will be rewritten in Phase 3 using https://www.steverobertson.dev as the source. (That domain is currently blocked by this environment's network policy, so it needs allowlisting or the content needs pasting in.)

---

## Decisions (Product Owner, 4 Oct 2026)

1. **Mobile**: restore the 20×36 portrait matrix, with content auto-wrapped from a single source and optional per-page mobile overrides.
2. **Deployment**: out of scope for now (private repo). Fix the defects first; the Pages config is kept but not a priority.
3. **Content**: new content, based on steverobertson.dev.
4. **Delivery**: one PR per phase.

## Remediation plan

| Phase | Scope |
|---|---|
| **0. Honest docs** | Add this review. Rewrite SPEC/ROADMAP to match the brief and the decisions above. Remove Gemini agent rules and template leftovers. Write a real README. |
| **1. Foundations** | Self-host Bedstead and drop Google Fonts. Fix the viewport meta. Add Vitest and Storybook. Fix the CI typecheck. |
| **2. Grid engine** | `<TeletextGrid cols rows>` with exact cells. A single CSS aspect-ratio switch (56×24 / 40×24 / 20×36). `min()` font sizing, zero scroll, safe-area insets. Header and Fastext as fixed grid rows. Double-height rows. |
| **3. Content pipeline** | One typed schema and one page registry. Colour-tag markup with a build-time wrapper (38/40 and 20 columns). Validator covers width, row count and link targets. Move 202/404 to content, add 888/203. New copy. |
| **4. Navigation & a11y** | Fastext as real links (R/G/Y/B). One shared digit buffer. A real semantic mirror with a live-region announcement and focus management. Page 888 Text mode (persisted). axe checks in CI. |
| **5. Graphics & polish** | Build-time image → 2×3 mosaic converter (text output, grid-aligned), optional edit.tf import. Scanline/glow overlay that respects `prefers-reduced-motion`, with a toggle. Sub-page cycling. |
| **6. Ship** (deferred) | Per-page pre-rendering. Base path and `404.html` fallback. Storybook at `/storybook`. Playwright visual tests at four viewports. |
