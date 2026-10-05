# Analytics: how it's wired and how to turn it on

The analytics half of [SPEC.md](SPEC.md) §4–5, built ahead of Flummox! at Steve's request (5 Oct 2026). Search (§3) is still to come.

## Turning it on

The code ships switched off. Nothing loads until the deploy knows the site's Plausible script.

1. Sign up at [plausible.io](https://plausible.io) (there is a free trial; check the current price before it ends) and add the site `steverobertson.dev`.
2. Plausible shows an install snippet. Copy just the script address from it, which looks like `https://plausible.io/js/pa-XXXXXXXX.js`. Ignore the rest of the snippet; the site adds it.
3. In the GitHub repo: **Settings → Secrets and variables → Actions → Variables → New repository variable**. Name `PLAUSIBLE_SCRIPT`, value the address from step 2.
4. Redeploy: **Actions → Deploy Teletext Portfolio to GitHub Pages → Run workflow** (or merge anything to main).
5. Open the live site; within a minute the visit shows in Plausible's dashboard. (If your browser sends Do Not Track or Global Privacy Control, or blocks plausible.io, your own visit won't count.)
6. To see the custom events in Plausible, add each as a **goal** (Site settings → Goals → Add goal → Custom event): `Navigate`, `Setting`, `Outbound`, `Not found`. Their properties show under each goal once they arrive.

To switch it off again, delete the variable and redeploy.

## What's counted

- **Page views**: Plausible's script counts the first page and every page change, since the app changes page through the History API (`/110/`, `/888/`). Referrers, countries and devices come with them.
- **Custom events** (`src/analytics/track.ts`):

| Event | Property | Values |
|---|---|---|
| `Navigate` | `method` | `digits` (typed or remote keypad), `fastext` (coloured bar or R/G/Y/B keys), `link` (any link on the page, quick index, text view), `remote` (the remote's other buttons) |
| `Setting` | `name`, `on` | `text mode`, `shortcuts`, `crt`; `true` or `false` |
| `Outbound` | `to` | `email`, `LinkedIn`, `GitHub`, or the site's host name |
| `Not found` | `path` | the page number or path asked for, e.g. `/999/` |

Nothing identifies a visitor. The Flummox! events in SPEC §4.2 come with Flummox!.

## How it's built

- `startAnalytics()` runs once from `src/main.tsx`. It adds Plausible's queue stub and the script only when the build was given `VITE_PLAUSIBLE_SRC` (the deploy passes `PLAUSIBLE_SCRIPT` through) and the visitor hasn't sent Global Privacy Control or Do Not Track. Only `https://plausible.io/js/….js` addresses are accepted.
- `track(event, props)` is typed by the table above and does nothing while analytics is off, so local dev, tests, Storybook and the pre-rendered HTML never count.
- Email and web links in the text view and the hidden mirror are picked up by one click listener; the Teletext screen reports its own.
- Page 888 has a second part with the privacy note (SPEC §5).

## Decisions

- Q3: Plausible, as the spec defaults.
- Q4: the script loads from plausible.io, not through our domain (GitHub Pages can't proxy).
- Q5: no public dashboard for now.
