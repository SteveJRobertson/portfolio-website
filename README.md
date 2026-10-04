# Steve-Text: Teletext Portfolio

Steve Robertson's developer portfolio, built as a Ceefax / ORACLE-style Teletext service: 3-digit page numbers, Fastext colour links, Mode 7 typography.

> **Status:** being fixed up after an AI-generated first draft. See [docs/REVIEW.md](docs/REVIEW.md) for the findings and [docs/ROADMAP.md](docs/ROADMAP.md) for progress.

## Getting started

```sh
npm ci
npm run dev        # http://localhost:5173
npm run validate   # check page content fits the grid
npm run build      # validate + typecheck + production build
npm run lint
```

## Project layout

| Path | Purpose |
|---|---|
| `src/content/pages/*.json` | One file per Teletext page |
| `src/components/` | Teletext UI components |
| `src/hooks/usePageBuffer.ts` | 3-digit page entry and routing |
| `scripts/validatePages.ts` | Build-time content checks |
| `docs/` | Spec, roadmap and review |

## Docs

- [SPEC.md](docs/SPEC.md): requirements and decision log
- [ROADMAP.md](docs/ROADMAP.md): phased delivery plan
- [REVIEW.md](docs/REVIEW.md): review of the original build
- [CONTENT.md](docs/CONTENT.md): content brief and proposed page map
