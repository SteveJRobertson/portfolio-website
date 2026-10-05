# Specification: Search and analytics

**Owner**: Steve Robertson (Product Owner)
**Status**: Draft, 5 Oct 2026. To be reviewed after Flummox! ([../flummox/SPEC.md](../flummox/SPEC.md)) ships. No plan or tasks until then.
**Builds on**: the v1 spec in [archive/steevefax-v1/SPEC.md](../archive/steevefax-v1/SPEC.md) ("v1 §5" and so on).

---

## 1. Summary

Two things STEEVEFAX doesn't do yet:

1. **Search**: help search engines find and describe the site, so that searching "Steve Robertson frontend engineer" leads here.
2. **Analytics**: count visits, which pages people read, and how Flummox! is played and shared, without cookies, without tracking individuals and without a consent banner.

The three-digit page numbers stay. They are the concept, and key-a-number navigation depends on them (§3.1).

## 2. Where things stand (checked 5 Oct 2026)

| Area | Today | Source |
|---|---|---|
| Pre-rendered HTML | Every page is a real file with its text in `#root` | `scripts/prerender.ts`, v1 §5 |
| Titles | `P101 About me \| Steve Robertson` | `documentTitle` in `src/content/meta.ts` |
| Descriptions | Five pages have their own; 101, 200, 201, 202, 203 and 404 fall back to the start of their text | `src/content/pages/*.json` |
| Canonical and Open Graph | On every page; `og:image:alt` is the index's text everywhere | `scripts/prerender.ts` |
| `sitemap.xml` | None | `public/` |
| `robots.txt` | None, and it can't work here: robots.txt is only read at the root of a host, and this site is under `/portfolio-website/` on `stevejrobertson.github.io` | |
| Structured data | None | |
| Domain | `stevejrobertson.github.io/portfolio-website/`. Steve's older site is at steverobertson.dev | v1 DEC-015, CONTENT.md |
| With JavaScript | The app swaps the pre-rendered text for the grid (`aria-hidden`) plus the semantic mirror, which is in the page but hidden behind the grid (`.mirror--hidden`) | `src/index.css` |
| Analytics | None | |

## 3. Search

### 3.1 Page numbers in URLs

Words in a URL are a weak ranking signal; titles, headings, descriptions and links matter far more. `/110/` with the title "P110 Experience | Steve Robertson" and the text of the page is fine. Replacing numbers with slugs (`/experience/`) would cost the Teletext feel and the shared-link look (`/152/`) for little gain. **Keep the numbers.**

### 3.2 Changes

1. **Domain** (the biggest win). Search engines already know steverobertson.dev as Steve's site. Serving STEEVEFAX there, with redirects from the old site's URLs to the matching pages, carries that standing over and puts robots.txt and the sitemap at a root where they work. The build already supports it (`BASE_PATH=/` and `SITE_URL`, v1 §11). Options in Q1.
2. **Sitemap**: `sitemap.xml` written by the pre-render step with every page except 404 and the Flummox! score pages, with `lastmod` from git.
3. **robots.txt**: allow all and point at the sitemap, once there is a root to put it at (custom domain), otherwise submit the sitemap through Search Console.
4. **Descriptions**: write one for 101, 200, 201, 202 and 203, and make the validator require one on every page except 404.
5. **Titles**: lead with the subject and keep the number, e.g. `About me (P101) | Steve Robertson, Senior Frontend Engineer` on the index and `About me (P101) | Steve Robertson` elsewhere, so results read naturally. Q2.
6. **Structured data**: a JSON-LD `Person` on page 100 (name, job title, location, `sameAs` to LinkedIn and GitHub) and a `WebSite` with the site name, STEEVEFAX.
7. **Per-page `og:image:alt`** (already planned in Flummox! T14a).
8. **The hidden mirror**: Google indexes the pre-rendered HTML and also renders the app. After rendering, the text is in the mirror, which is hidden behind the grid. Hidden text can count for less, so we check with Search Console's URL Inspection what Google sees, and if it's thin, keep the mirror's text readable to crawlers (for example visually hidden rather than layered behind).
9. **Search Console** (Google) and **Bing Webmaster Tools**: verify the site with a meta tag, submit the sitemap, watch coverage.

## 4. Analytics

### 4.1 Tool

A cookieless, privacy-first tool, so no consent banner is needed (§5).

| Tool | Cost | Custom events with values | Notes |
|---|---|---|---|
| **Plausible** | Paid, monthly | Yes (custom properties) | EU-hosted, simple dashboard, script about 1 KB, open source |
| **Umami** | Free cloud tier, or self-host | Yes (event data) | Open source; free tier has limits |
| **GoatCounter** | Free for personal sites | Basic (event names only) | Very light, fewer reports |
| Google Analytics 4 | Free | Yes | Cookies and a consent banner, heavier script. Not recommended |

**Default: Plausible** (Q3). Check current pricing and limits before signing up; they change.

All of these follow History API page changes (v1 §5), so page views are counted without full reloads. The script loads from the tool's domain (or a proxy on ours, Q4) and is skipped when the visitor's browser sends Global Privacy Control or Do Not Track.

### 4.2 What is counted

Page views per page number, referrers, countries and devices come free. Custom events:

| Event | Properties | Why |
|---|---|---|
| `Navigate` | `method`: digits, Fastext, index link, quick index, remote | Which ways of getting around people use |
| `Setting` | `name`: text mode, shortcuts, CRT; `on` | Whether the 888 options are used |
| `Outbound` | `to`: email, LinkedIn, GitHub, project | Contact intent, the point of a portfolio |
| `Flummox start` | `edition` | Plays per edition |
| `Flummox flummoxed` | `edition`, `question` | Which questions catch people out |
| `Flummox finish` | `edition`, `score` | Score spread |
| `Flummox share` | `network` (Bluesky, X, …, copy, save picture, share sheet) | Which networks people use |
| `Not found` | `path` | Broken links into the site |

Nothing identifies a person: no user IDs, no answers typed, no free text. Scores are only ever seen as totals.

### 4.3 Where it goes in the code

One module, `src/analytics/track.ts`, with a typed `track(event, props)` that does nothing when the script isn't loaded (local dev, tests, blocked by the visitor). Components call it; nothing else knows which tool is behind it, so the tool can change.

## 5. Privacy and consent

- **Consent rules** (UK PECR and GDPR, EU ePrivacy) apply to storing or reading information on a visitor's device, and to personal data. Plausible and Umami set no cookies and store nothing on the device, and don't identify visitors, so no consent banner is needed. *This is a reading of the rules, not legal advice.*
- **The site's own storage** (Text mode, shortcuts and CRT settings; the Flummox! game and best score) is there for features the visitor uses, which the rules exempt. It never leaves the browser.
- **Privacy note**: a short section on page 888 (and in Text mode) saying what is counted, by which tool, that there are no cookies, and that the site's own storage stays in the browser.
- If a future change needs cookies or personal data, a consent screen is designed then, as a Teletext page rather than a pop-up.

## 6. Out of scope

- Changing the page-number scheme.
- Advertising, remarketing or social pixels.
- Per-visitor reports, session replay, heatmaps.

## 7. Open questions for Steve

| # | Question | Default |
|---|---|---|
| Q1 | Domain? (a) STEEVEFAX on steverobertson.dev, replacing the old site, with redirects; (b) a subdomain such as teletext.steverobertson.dev, linked from the old site; (c) stay on github.io | (a) |
| Q2 | Title format? | Subject first, number in brackets (§3.2.5) |
| Q3 | Analytics tool? | Plausible |
| Q4 | Load the script through our own domain, so ad blockers count less often? Needs a custom domain with a proxy (not possible on GitHub Pages alone) | No |
| Q5 | Public dashboard (Plausible can share one) linked from 888? | No |

## 8. Decision log

| ID | Decision |
|---|---|
| SEO-001 | Keep three-digit page numbers in URLs. |
| SEO-002 | Analytics must be cookieless and not identify visitors, so there is no consent banner. |
