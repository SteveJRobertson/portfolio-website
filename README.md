# Steve-Text: Teletext Portfolio

Steve Robertson's developer portfolio, built as a Ceefax / ORACLE-style Teletext service: 3-digit page numbers, Fastext colour links, Mode 7 typography.

> **Status:** being fixed up after an AI-generated first draft. See [docs/REVIEW.md](docs/REVIEW.md) for the findings and [docs/ROADMAP.md](docs/ROADMAP.md) for progress.

## Getting started

Requires Node 22 (see `.nvmrc`).

```sh
npm ci
npm run dev        # http://localhost:5173
npm run storybook  # design system at http://localhost:6006
npm test           # unit tests (Vitest)
npm run validate   # check page content fits the grid
npm run typecheck
npm run lint
npm run build      # validate + typecheck + production build
```

## Project layout

| Path | Purpose |
|---|---|
| `src/content/pages/*.json` | One file per Teletext page, written with colour tags (see SPEC §7) |
| `src/content/` | Tag parser, wrapper, semantic mirror builder, validator and the page registry |
| `src/display/` | Grid modes and screen layout |
| `src/components/` | Teletext UI components |
| `src/navigation/` | Routing, the shared 3-digit buffer and hotkeys |
| `src/settings/` | Saved Text mode and shortcut settings (page 888) |
| `scripts/` | `validatePages.ts` and the Vite plugin that compiles the pages |
| `src/design-system/` | Token stories and helpers |
| `public/fonts/` | Self-hosted Bedstead (CC0) |
| `docs/` | Spec, roadmap, review and content brief |

## Docs

- [SPEC.md](docs/SPEC.md): requirements and decision log
- [ROADMAP.md](docs/ROADMAP.md): phased delivery plan
- [REVIEW.md](docs/REVIEW.md): review of the original build
- [CONTENT.md](docs/CONTENT.md): content brief and proposed page map
