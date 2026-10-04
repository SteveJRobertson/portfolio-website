# Specification: Teletext Web Portfolio

**Owner**: Steve Robertson (Product Owner)
**Status**: Agreed baseline. Restored from the original brief on 4 Oct 2026; see [REVIEW.md](./REVIEW.md).

---

## 1. Summary

A developer portfolio built as an authentic European Teletext (Ceefax / ORACLE) service. It should be memorable first: when look and feel conflict with accessibility, look and feel wins. Accessibility is still provided in full through a parallel semantic layer and a plain "Text mode".

## 2. Stack

| Domain | Choice | Notes |
|---|---|---|
| Build | Vite + TypeScript | Static output in `dist/`. |
| UI | React | State for the 3-digit buffer, clock, sub-page cycling and key handling. |
| Design system | Storybook | Tokens, primitives and screen layouts, shown in isolation. |
| Content | Local JSON files in `src/content/pages/` | No CMS. Validated at build time. |
| Font | Bedstead (self-hosted WOFF2) | Mode 7 / SAA5050 geometry. Public domain. |
| Tests | Vitest (unit), Playwright (visual, later) | |
| Hosting | GitHub Pages via GitHub Actions | **Deferred**: the repo is private. |

## 3. Display engine

The viewport is always locked to `100dvh` with no window scroll. The grid mode is chosen by **aspect ratio only**, from one place in CSS:

| Mode | Query | Grid | Layout |
|---|---|---|---|
| Widescreen | `min-aspect-ratio: 16/10` | 56 × 24 | 38-column main pane, 1-column separator, 17-column quick-index sidebar |
| Classic | `1/1` to `16/10` | 40 × 24 | Traditional 4:3 screen |
| Portrait | `max-aspect-ratio: 1/1` | 20 × 36 | Tall phone matrix, no scroll, safe-area insets |

- Every screen renders exactly `cols × rows` character cells. Row 1 is the header and the last row is the Fastext bar.
- Font size is `min(font-from-width, font-from-height)`, so the whole grid always fits.
- `white-space: pre`, font smoothing disabled.
- Double-height rows take up two row slots.
- An optional CRT scanline/glow overlay, off when `prefers-reduced-motion` is set, with a toggle on page 888.

## 4. Design tokens

- Background `#0C0C0C`.
- Foreground: white `#FFFFFF`, yellow `#FFFF00`, cyan `#00FFFF`, green `#00FF00`, magenta `#FF00FF`, red `#FF3333`, blue `#4D79FF` (lightened for contrast).
- Atoms: `TeletextChar`, `ColorSpan`, `FastextButton`, `ScanlineOverlay`.
- Molecules: `HeaderTicker`, `PageBufferDisplay`, `NumericKeypad`.
- Organisms: `TeletextGrid` (56×24 / 40×24 / 20×36), `TeletextScreen`.

## 5. Navigation

- **3-digit buffer**: one shared buffer fed by the keyboard (`0`–`9`) and the on-screen keypad. The header shows `P1--` while you type. The third digit navigates. `Escape` clears.
- **Routing**: path based (`/100`, `/101`, …; `/` = 100), using the History API so back, forward and bookmarks work.
- **Unknown pages**: show an authentic "PAGE NOT FOUND" screen that links back to 100.
- **Fastext**: four slots per page (red, green, yellow, blue/cyan). Rendered as real `<a href>` links with a clear focus style. Hotkeys `R`, `G`, `Y`, `B`, ignored when a modifier key is held.
- **Sub-pages**: long pages can cycle (`01/03`) on a timer, with a way to hold or pause.
- **Mobile**: the on-screen keypad means the native keyboard never opens.

## 6. Pages

| Page | Content |
|---|---|
| 100 | Index / cover |
| 101 | About |
| 110 | Experience (sub-pages, one per role) |
| 200 | Projects index; 201–20x individual projects |
| 300 | Skills (sub-pages by group) |
| 400 | Contact |
| 888 | Accessibility: Text mode and CRT effect toggles |
| 404 | Page not found |

There is one page registry. The router, sidebar, keypad, semantic tree and validator all read from it.

## 7. Content schema and validation

- Each page is a JSON file with `page`, `title`, `fastext`, `rows`, and optional `mobileRows` and `subpages`.
- Rows are written once using colour tags (e.g. `{cyan}TEXT{/}`). A build-time wrapper lays them out for 38/40 columns and for 20 columns. `mobileRows` overrides the automatic portrait layout.
- The validator fails the build when:
  1. a row is wider than the mode's column limit;
  2. a page has more rows than the mode allows;
  3. a Fastext or inline link points at a page that doesn't exist;
  4. an unknown colour tag is used.

## 8. Graphics

- Block graphics use 2×3 mosaic characters on the grid, never free-floating `<canvas>` pixels.
- A build-time converter turns raster images (headshot, project screenshots) into mosaic text in the 8-colour palette.
- Optionally, artwork drawn in edit.tf can be imported.
- All graphics are `aria-hidden`, with a text alternative in the semantic tree.

## 9. Accessibility

1. **Semantic mirror**: the visual grid is `aria-hidden` and contains **no focusable elements**. The interactive controls and a visually hidden semantic tree (headings, paragraphs, lists, links) present the same content. Page changes are announced through a live region, and focus moves to the page heading.
2. **Text mode (page 888)**: switches the whole UI to a clean, high-contrast HTML reader view. The choice is remembered.
3. Pinch-zoom is never blocked. Focus is always visible. Keyboard listeners add to normal navigation and never replace it.

## 10. Decision log

| ID | Decision |
|---|---|
| DEC-001 | Vite + React + TypeScript + Storybook. |
| DEC-002 | Bedstead, self-hosted. No third-party font CDN. |
| DEC-003 | Semantic mirror + Text mode for accessibility. The visual grid stays non-interactive for assistive tech. |
| DEC-004 | Aspect-ratio engine: 56×24 / 40×24 / 20×36. Supersedes Gemini's "scaled 40×24 + remote" mobile approach, which was never signed off. |
| DEC-005 | Write content once with colour tags and wrap it at build time. Per-page `mobileRows` override. |
| DEC-006 | Path-based routing. |
| DEC-007 | Deployment deferred while the repo is private. |
| DEC-008 | Deliver as one PR per phase, on stacked branches (see [ROADMAP.md](./ROADMAP.md)). |
| DEC-009 | Page map from [CONTENT.md](./CONTENT.md) approved, including 110 Experience with per-role sub-pages. |

## 11. Open questions

- Final Fastext hotkey for the fourth button: `B` (matches the original remote) or `C` (matches the colour).
- Sub-page cycle interval and how to hold or pause.
- Custom domain vs `github.io` when deployment resumes.
