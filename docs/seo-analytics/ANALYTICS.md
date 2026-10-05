# Analytics: how it's wired and how to turn it on

The analytics half of [SPEC.md](SPEC.md) §4–5, built ahead of Flummox! at Steve's request (5 Oct 2026). Search (§3) is still to come.

The tool is **Umami Cloud** on its free Hobby plan (checked 5 Oct 2026: up to 100K events a month, 6 months of data). Steve chose it over Plausible, the spec's first default, to avoid a monthly fee. Like Plausible it sets no cookies and doesn't identify visitors, so no consent banner is needed.

## Turning it on

The code ships switched off. Nothing loads until the deploy knows the site's Umami website ID.

1. Sign up at [cloud.umami.is](https://cloud.umami.is) (the free plan needs no card) and add a website: name STEEVEFAX, domain `steverobertson.dev`.
2. Open the website's settings and copy its **Website ID**, which looks like `94db1cb1-74f4-4a40-ad6c-962362670409`. (The tracking code it shows contains the same ID; the site adds the script itself.)
3. In the GitHub repo: **Settings → Secrets and variables → Actions → Variables → New repository variable**. Name `UMAMI_WEBSITE_ID`, value the ID from step 2.
4. Redeploy: **Actions → Deploy Teletext Portfolio to GitHub Pages → Run workflow** (or merge anything to main).
5. Open the live site; the visit shows in Umami's realtime view within a minute. (If your browser sends Do Not Track or Global Privacy Control, or an ad blocker blocks cloud.umami.is, your own visit won't count.)
6. Custom events appear under **Events** with no setup; their properties are under each event's details.

To switch it off again, delete the variable and redeploy.

## What's counted

- **Page views**: Umami's script counts the first page and every page change, since the app changes page through the History API (`/110/`, `/888/`). Referrers, countries and devices come with them.
- **Custom events** (`src/analytics/track.ts`):

| Event | Property | Values |
|---|---|---|
| `Navigate` | `method` | `digits` (typed or remote keypad), `fastext` (coloured bar or R/G/Y/B keys), `link` (any link on the page, quick index, text view), `remote` (the remote's other buttons) |
| `Setting` | `name`, `on` | `text mode`, `shortcuts`, `crt`; `true` or `false` |
| `Outbound` | `to` | `email`, `LinkedIn`, `GitHub`, or the site's host name |
| `Not found` | `path` | the page number or path asked for, e.g. `/999/` |

Nothing identifies a visitor. The Flummox! events in SPEC §4.2 come with Flummox!.

## How it's built

- `startAnalytics()` runs once from `src/main.tsx`. It adds `https://cloud.umami.is/script.js` only when the build was given `VITE_UMAMI_WEBSITE_ID` (the deploy passes `UMAMI_WEBSITE_ID` through), the page isn't on localhost, and the visitor hasn't sent Global Privacy Control or Do Not Track. Only a UUID is accepted as the ID.
- `track(event, props)` is typed by the table above and does nothing while analytics is off, so local dev, tests, Storybook and the pre-rendered HTML never count.
- Email and web links in the text view and the hidden mirror are picked up by one click listener; the Teletext screen reports its own.
- Page 888 has a second part with the privacy note (SPEC §5).
- Swapping tools means changing `track.ts`, the deploy variable and the 888 note; nothing else knows the tool.

## Decisions

- Q3: Umami Cloud, free plan.
- Q4: the script loads from cloud.umami.is, not through our domain (GitHub Pages can't proxy).
- Q5: no public dashboard for now (Umami can share one later).
