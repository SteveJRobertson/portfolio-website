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
| Tests | Vitest (unit), Playwright (end to end, axe and screenshots) | Playwright runs against the production build at four viewports. |
| Hosting | GitHub Pages via GitHub Actions | https://stevejrobertson.github.io/portfolio-website/, deployed after CI passes on `main`. Storybook at `/storybook/`. |

## 3. Display engine

The viewport is always locked to `100dvh` with no window scroll. The grid mode is chosen by **aspect ratio only**, from one place: `src/display/gridModes.ts` holds the queries and grid sizes, and CSS follows it through `data-mode` and `--cols`/`--rows` (DEC-010):

| Mode | Query | Grid | Layout |
|---|---|---|---|
| Widescreen | `min-aspect-ratio: 16/10` | 56 × 24 | 38-column main pane, 1-column separator, 17-column quick-index sidebar |
| Classic | `1/1` to `16/10` | 40 × 24 | Traditional 4:3 screen |
| Portrait | `max-aspect-ratio: 1/1` | 32 × 34 | Tall phone matrix, no scroll, safe-area insets (DEC-016) |

- Every screen renders exactly `cols × rows` character cells. Row 1 is the header and the last row is the Fastext bar.
- Each cell is one Bedstead glyph, 0.6em × 1em, so mosaic characters tile with no gaps.
- Font size is `min(font-from-width, font-from-height)`, so the whole grid always fits.
- `white-space: pre`, font smoothing disabled.
- Double-height rows take up two row slots.
- A CRT effect: scanlines and a vignette over the screen, and a soft glow on the glyphs. It's static (nothing flickers or rolls), never takes clicks and is `aria-hidden`. It's on until the visitor chooses, except that it starts off when `prefers-reduced-motion: reduce` or `prefers-contrast: more` is set. Its switch is on page 888 next to Text mode and Shortcuts, and the choice is remembered. Text mode never shows it.

## 4. Design tokens

- Background `#0C0C0C`.
- Foreground: white `#FFFFFF`, yellow `#FFFF00`, cyan `#00FFFF`, green `#00FF00`, magenta `#FF00FF`, red `#FF3333`, blue `#4D79FF` (lightened for contrast).
- Atoms: `TeletextChar`, `ColorSpan`, `FastextButton`, `ScanlineOverlay`, `HoldButton`, mosaic cells.
- Molecules: `HeaderTicker`, `PageBufferDisplay`, `NumericKeypad`.
- Organisms: `TeletextGrid` (56×24 / 40×24 / 32×34), `TeletextScreen`.

## 5. Navigation

- **3-digit buffer**: one shared buffer fed by the keyboard (`0`–`9`) and the on-screen keypad. The header shows `P1--` while you type. The third digit navigates. `Escape` clears.
- **Routing**: path based (`/101/`, `/110/`, …; the site root = 100), using the History API so back, forward and bookmarks work. `pageHref()` in `src/navigation/paths.ts` is the only place a page URL is built; it adds Vite's `base` (`/portfolio-website/` on GitHub Pages, from `GITHUB_PAGES=true`, or `BASE_PATH`) and a trailing slash, and `pageFromPath()` strips them.
- **Pre-rendering**: after the build, `npm run prerender` writes `NNN/index.html` for every page and `404.html` for the not-found page, so every URL is a real file. Each has its own title, description (the page's `description`, or the start of its text), canonical link and Open Graph tags with `public/share.png`, and the semantic mirror as static HTML in `#root`, shown only without JavaScript. The app replaces it on load (no hydration).
- **Unknown pages**: show an authentic "PAGE NOT FOUND" screen that links back to 100. Any page number or path that isn't in the registry redirects to `/404` (a replace on load or back/forward, a push when navigating).
- **Fastext**: four slots per page (red, green, yellow, cyan). Rendered as real `<a href>` links with a focus style distinct from hover; a plain click navigates in place, a modified click opens a new tab. Each label is in its key's colour on black, as on a real set; focus inverts it to black on that colour inside a white outline. A slot pointing at 100 reads HOME. Hotkeys `R`, `G`, `Y`, and `B` or `C` for the fourth.
- **Hotkeys**: one listener (`useHotkeys`). Keys with a modifier and keys typed into form fields are ignored. The digit and letter shortcuts (including `H` for HOLD) can be switched off on page 888 (WCAG 2.1.4); `←`/`→` are off in Text mode.
- **Sub-pages**: pages with sub-pages cycle every 15 seconds (`SUBPAGE_INTERVAL_MS`), wrapping round, and the header shows the counter (`2/6`). A manual step (`←`/`→`, the keypad, or focus moving into another part of the mirror) restarts the countdown. **HOLD** freezes the current sub-page until it's released: the `H` key, a HOLD button in the strip under the screen (shown only on pages with sub-pages, so it works with shortcuts off), or the keypad. While held the header shows `HOLD` after the counter, dropping the date at 40 columns and the name at 20 to make room. Cycling also waits, without setting HOLD, while the tab is hidden, while keyboard focus is in the semantic mirror, and in Text mode. With `prefers-reduced-motion: reduce` every page opens held. Changing page goes back to the first sub-page and releases HOLD. Manual steps and HOLD are announced in the live region; timed steps aren't, because the mirror already holds every part (WCAG 2.2.2 is met by HOLD).
- **Mobile**: the on-screen keypad means the native keyboard never opens. Its colour buttons follow the current page's Fastext.
- **Links in the grid**: inline `{link:NNN}` text, quick-index entries, and email and web addresses (found at build time, `mailto:` or a new tab) respond to a click or tap, but never take keyboard focus. Their real links are in the semantic mirror.

## 6. Pages

| Page | Content |
|---|---|
| 100 | Index / cover |
| 101 | About |
| 110 | Experience (sub-pages, one per role) |
| 200 | Projects index; 201 Isolate UI, 202 Lighthouse Compare, 203 Steevefax |
| 300 | Skills (sub-pages by group) |
| 400 | Contact |
| 888 | Accessibility: Text mode and CRT effect toggles |
| 404 | Page not found |

There is one page registry. The router, sidebar, keypad, semantic tree and validator all read from it.

## 7. Content schema and validation

- Each page is a JSON file `src/content/pages/pageNNN.json` with `page`, `title`, optional `description` (for search results and link previews), `label` (short name for the quick index and Fastext), `fastext` (four `{ "page": NNN }` entries, red to cyan, with an optional `label`), optional `index` (list it in the quick index), and either `rows` or `subpages`. `mobileRows` / `mobileSubpages` optionally override the portrait layout line for line.
- A row is one logical line of any length: a string, or an object `{ "text": … }` with optional `"doubleHeight": true`, `"heading": true` (a heading in the semantic mirror) and `"screenOnly": true` (left out of the mirror, for hints like "Press ← or →"). An empty string is a blank row. Any other key is an error.
- A banner row `{ "banner": "EXPERIENCE", "bg": "red" }` sets the page title in mosaic block letters on a band of `bg`, with a thin lip under it, as on Ceefax's section headers (3 row slots). Colour tags colour the letters (white by default), and a space between two colour runs is the one-cell gap a colour change costs, e.g. `{white}STEVE{/} {yellow}ROBERTSON{/}`. The band starts one cell in and the letters two cells after that. Bold letters are used when they fit with a cell to spare, then a condensed face, then double-height text on the band (usually in portrait); a title too long for all three is an error. Each section keeps its band colour: red for 101 and 110, green for 200–203, yellow for 300, cyan for 400, magenta for 888, blue for the index.
- An image row is `{ "image": "steve", "alt": "…", "rows": 12 }`, for `src/content/images/steve.png`, with optional `mobileRows`, `palette` (the colours it may use), `contrast`, `saturation` and `brightness`. `rows` is its height at 38 columns and the width follows the picture's shape; portrait fits it into 32 columns unless `mobileRows` is set. `"pixelArt": true` uses a PNG drawn at 2 × 3 pixels a cell as it is (see §8). `"beside": [rows]` lays text out to the right of the picture, as on a Ceefax page, when that leaves at least 12 columns; otherwise (portrait) the text goes under it. A picture on its own is centred (see §8).
- Colour tags: `{red}` `{green}` `{yellow}` `{blue}` `{magenta}` `{cyan}` `{white}` and `{bg:colour}`, closed by `{/}`; `{link:NNN}…{/}` is an inline page link; `{rule}` alone on a row draws a full-width solid mosaic bar, and `{rule:-}` repeats that character instead; `{dots}` is a leader that fills the line with dots so what follows ends at the right edge (one per line, never wrapped); `{{` is a literal brace.
- A build-time wrapper (a Vite plugin serving `virtual:pages`) lays every row out at **38 columns**, used by both widescreen and classic so their line breaks match, and at **32 columns** for portrait. Rows get a one-cell margin; `* ` bullets and `NNN ` page numbers hang their continuation lines; lines can also break after `/`, `-` and `@`. Dev, build, Storybook and Vitest all use the same plugin.
- The validator (`npm run validate`, and the plugin on every build) fails when:
  1. a row is wider than the mode's column limit;
  2. a page or sub-page has more rows than the mode allows (22, or 34 in portrait; double height counts as two);
  3. a Fastext or inline link points at a page that doesn't exist;
  4. an unknown or unclosed tag is used;
  5. a file name doesn't match its page number, or two files define the same page;
  6. an image is missing from `src/content/images`, has no `alt` text, or is wider than the pane at its height; pixel art isn't 2 × 3 pixels a cell, its `rows` doesn't match its height, or a cell uses more than two colours.

## 8. Graphics

- Block graphics use 2×3 mosaic characters on the grid, never free-floating `<canvas>` pixels.
- A build-time converter (`src/content/mosaic.ts`, run by the content plugin, so nothing generated is committed) turns PNGs in `src/content/images/` into mosaic cells in the 8-colour palette:
  1. Transparent pixels become the black screen, then the optional saturation, contrast and brightness tweaks apply.
  2. The picture is scaled down by area averaging to 2 pixels across and 3 down per cell. Those pixels are almost square (0.3em × 0.33em), so a picture keeps its shape with `cols = rows × aspect × 5/3`.
  3. Each cell takes the pair of palette colours (foreground and background) that matches its six pixels best, and each pixel takes the nearer of the two. There's no dithering: at 2×3 pixels a cell it only adds speckle.
  4. The six bits pick the character: space, `█`, `▌`, `▐`, or U+1FB00–U+1FB3B. A cell of one colour is a space on that background, so neighbouring cells have no seams. Mosaic backgrounds use the full-strength palette (`m-bg-*`), not the darker text backgrounds.
- **Pixel art** is the better choice for people: Teletext faces read as caricatures, with flat colour, strong shapes and a black background, and a converted photo at this size turns to mush. A pixel-art PNG is drawn at exactly 2 × 3 pixels a cell in palette colours, with transparent pixels as the black screen, and used without scaling. Each cell may use only two colours, as on a real set, and the validator says which cells break that.
- Photos convert best cropped to the subject with the background removed. Each cell has its own two colours, rather than Teletext's rule that a colour change costs a cell.
- PNGs are decoded with `pngjs` at build time only; nothing ships to the browser but the cells.
- edit.tf import is left out until there's artwork to import (DEC-013).
- All graphics are `aria-hidden`, with a text alternative in the semantic tree: an image row's `alt` becomes `role="img"` in the mirror and an "Image: …" caption in Text mode.

## 9. Accessibility

1. **Semantic mirror**: every grid line is `aria-hidden` and the grid contains **no focusable elements** except the Fastext links. The compiler builds the mirror from the logical rows, before wrapping: the page `title` is the `<h1>`; banners, double-height rows, `{rule}`s, blank and `screenOnly` rows are dropped; `heading` rows become `<h2>`; `* ` rows and page-directory rows (`{link:NNN}NNN  Name`, or `Name{dots}{link:NNN}NNN`) become lists; other rows become paragraphs; `{link:NNN}` and email or web addresses become real links. Every sub-page is present at once.
2. **Focus**: after a user-initiated page change, focus moves to the `<h1>` (not on first load). Sub-page steps are announced through a polite live region. A skip link, visible on focus, comes first. While an element in the hidden mirror has keyboard focus, its twin in the grid (the linked text) is outlined; a control with no twin on screen shows itself as a caption at the top of the screen. The `<h1>` is not a control, so it takes focus without an outline.
3. **Text mode (page 888)**: renders the same mirror as a plain, high-contrast reader view (AAA contrast, normal scroll). The switches sit in the strip under the screen on 888, and every Text mode page has a "Teletext view" button. The choice is remembered in `localStorage`, falling back to off.
4. Pinch-zoom is never blocked. Focus is always visible. Keyboard listeners add to normal navigation and never replace it.

## 10. Decision log

| ID | Decision |
|---|---|
| DEC-001 | Vite + React + TypeScript + Storybook. |
| DEC-002 | Bedstead, self-hosted. No third-party font CDN. |
| DEC-003 | Semantic mirror + Text mode for accessibility. The visual grid stays non-interactive for assistive tech. |
| DEC-004 | Aspect-ratio engine: 56×24 / 40×24 / 20×36. Supersedes Gemini's "scaled 40×24 + remote" mobile approach, which was never signed off. |
| DEC-005 | Write content once with colour tags and wrap it at build time. Per-page `mobileRows` override. |
| DEC-006 | Path-based routing. |
| DEC-007 | Deployment deferred while the repo is private. Resolved in Phase 6: the repo is public (5 Oct 2026). |
| DEC-008 | Deliver as one PR per phase, on stacked branches (see [ROADMAP.md](./ROADMAP.md)). |
| DEC-009 | Page map from [CONTENT.md](./CONTENT.md) approved, including 110 Experience with per-role sub-pages. |
| DEC-010 | The mode queries live in one TypeScript module (React needs `cols × rows` to render the cells) and CSS keys off `data-mode`. Revisit for pre-rendering in Phase 6. |
| DEC-011 | Content is wrapped once at 38 columns for widescreen and classic, and at 20 for portrait. Until Phase 5 adds cycling, sub-pages are stepped with ←/→ and the keypad. The old canvas demo on 202 is dropped; 203 gets mosaic graphics in Phase 5. |
| DEC-012 | Phase 4: the 888 switches live in the strip under the screen; grid links answer clicks but never take focus, with real links in the mirror and a focus outline on the grid twin; mirror headings are marked with `"heading": true` rather than guessed from colour; axe runs in Vitest with jsdom (contrast stays in `contrast.test.ts`), with Playwright left for Phase 6; `B` and `C` both work for the fourth Fastext slot. |
| DEC-013 | Phase 5: sub-pages cycle every 15 seconds and a manual step restarts the countdown (rather than holding the page); HOLD is the `H` key, a strip button and the keypad; pages open held with reduced motion. Images are PNGs converted at build time with each cell choosing its own two colours and no dithering. The portrait was first a converted photo on 203, which Steve found too big and too soft; it's now a 16 × 12-cell cartoon of Steve, drawn as pixel art from his photo (a cyan baseball cap with a blue peak), on page 101 with his summary beside it. 101 becomes two sub-pages so the picture fits in portrait. The CRT effect is static and on by default, off at first with reduced motion or more contrast. edit.tf import is deferred. |
| DEC-014 | Headings (after a review of real Ceefax, Webfax and SPARK pages): page titles are Ceefax-style banners of mosaic block letters on a section-coloured band, replacing double-height text over a row of `=`; `{rule}` becomes a solid mosaic bar; Fastext is coloured text on black and its link to 100 reads HOME; the index lists pages as `Name.....NNN` with dotted leaders, white with cyan numbers. |
| DEC-015 | Phase 6 (ship): GitHub Pages at the `github.io` address, with the base configurable for a custom domain later. Pages are pre-rendered per page with the mirror as static HTML (replaced, not hydrated, so the grid stays client-rendered). Page URLs end in a slash. Playwright (Chromium) runs navigation, axe with contrast and screenshot tests against the production build at 1920×1080, 1440×900, 1024×768 and 390×844; baselines are made in the Playwright Docker image by the "Update visual baselines" workflow, and axe leaves out mosaic cells, whose banner contrast is checked at 3:1 in Vitest. The magenta (888) and cyan (400) banners use black letters. |
| DEC-016 | Portrait grid widened from 20 × 36 to 32 × 34 (supersedes the portrait size in DEC-004). On a real phone the browser bars leave a viewport of about 0.55–0.6 width to height, so 20 × 36 was bound by height and filled only about 55% of the width with text wrapping at ~20 characters. 32 × 34 matches that shape: it fills the width at a similar or larger font size. The header shows STEEVEFAX at 32 columns, and Fastext labels may fill an 8-cell slot when the centring still leaves a gap between neighbours. |

## 11. Open questions

- Custom domain (it would only need `BASE_PATH=/` and `SITE_URL`). Launched on `github.io`.
