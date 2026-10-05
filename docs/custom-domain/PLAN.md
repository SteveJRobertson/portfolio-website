# Plan: Move steverobertson.dev to STEEVEFAX

**Owner**: Steve Robertson
**Status**: Draft, 5 Oct 2026. The repo change is ready; the cutover waits for Steve.
**Answers**: Q1 in [../seo-analytics/SPEC.md](../seo-analytics/SPEC.md), option (a): STEEVEFAX on steverobertson.dev, replacing the old site.

---

## 1. How steverobertson.dev is served today

**Vercel.** The sandbox can't resolve the domain or open it, so this comes from GitHub, not DNS:

| Repo | What it is | Hosting evidence |
|---|---|---|
| `portfolio-site-2026` | The current site: a Vite + React app built with Lovable, one page at `/`. Its `og:url` is `https://www.steverobertson.dev/` | Every push deploys to **two** Vercel projects in the `steve-robertsons-projects` team: `portfolio-site-2026` and `portfolio-site-2026-gdle` (last production deploy 2 May 2026). Repo homepage: `portfolio-site-2026-teal.vercel.app` |
| `portfolio-site` | The 2023 Next.js site | Vercel deployments in Aug 2023, `@vercel/analytics`; repo homepage is `https://steverobertson.dev` |

To confirm in Vercel (Settings → Domains on each project): which project holds `steverobertson.dev` and `www.steverobertson.dev`, DNS is at GoDaddy (Steve checked, 5 Oct): `A @ 216.198.79.1` and `www CNAME …vercel-dns-017.com`, no email records.

**Watch out:** the old user-site repo `stevejrobertson.github.io` has a `CNAME` of `sr.digital` (2018). If that repo still publishes to Pages with that domain, GitHub sends every project site, this one included, to `sr.digital/…`. Check Settings → Pages on that repo; if Pages is on, turn it off or remove the domain before the cutover.

## 2. What changes in this repo

`deploy.yml` reads a repository variable, `CUSTOM_DOMAIN`:

- **Unset** (today): base `/portfolio-website/`, canonical URLs on `stevejrobertson.github.io`. Nothing changes.
- **Set to `steverobertson.dev`**: base `/`, canonical and Open Graph URLs on `https://steverobertson.dev`, Storybook at `/storybook/`.

No `CNAME` file: GitHub ignores it when deploying from Actions; the domain is set in Settings → Pages. CI and the e2e tests keep building the `/portfolio-website/` version, which is unaffected.

## 3. Cutover (Steve, in this order)

Done this way, the old Vercel site keeps serving until DNS flips, so the only gap is HTTPS while GitHub issues the certificate (`.dev` is HTTPS-only, so the site is unreachable for those minutes, usually under an hour).

1. **Merge the prep PR.** No visible change.
2. **Verify the domain** (any time before): GitHub → your profile Settings → Pages → Add a domain → `steverobertson.dev`, then add the `_github-pages-challenge-SteveJRobertson` TXT record it gives you. This stops anyone else claiming the domain on Pages.
3. **Lower the TTL** on the apex and `www` records to 300 seconds, a day ahead if you can.
4. **Point Pages at the domain.** In this repo: Settings → Secrets and variables → Actions → Variables → add `CUSTOM_DOMAIN` = `steverobertson.dev`. Then Settings → Pages → Custom domain → `steverobertson.dev` → Save. Then Actions → Deploy → Run workflow. From now on `stevejrobertson.github.io/portfolio-website/…` redirects to `steverobertson.dev/…`, which is still the Vercel site until step 5.
5. **Switch DNS** at GoDaddy, which hosts the zone. Leave NS, SOA and `_domainconnect` alone.
   - Remove the Vercel records: apex `A 216.198.79.1` and the `www CNAME …vercel-dns-017.com`.
   - Apex `A`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - Apex `AAAA`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `www CNAME stevejrobertson.github.io` (GitHub redirects `www` to the apex).
6. **Remove the domain from Vercel** (both 2026 projects, and the 2023 one if it's still listed), so Vercel stops claiming it.
7. **Wait for the certificate**: Settings → Pages shows "DNS check successful", then tick **Enforce HTTPS**.
8. **Check**: `https://steverobertson.dev/`, `/110/`, `/storybook/`, `https://www.steverobertson.dev/` and an old `github.io/portfolio-website/110/` link all land on STEEVEFAX.

## 4. Old URLs

The old site is one page at `/`, so there is nothing to map: `/` is the new index, and anything else gets the Teletext 404. Pages can't do server redirects anyway.

## 5. Afterwards

- Search Console: add steverobertson.dev as a domain property (DNS TXT) and resubmit; this is where the SEO spec's sitemap and `robots.txt` work picks up, now there's a root to put them at.
- Update links that point elsewhere: this repo's homepage field, GitHub profile, LinkedIn.
- Vercel Analytics on the old site stops; cookieless analytics comes with the SEO and analytics work.
- After a week or so, archive or delete the old Vercel projects and archive `portfolio-site-2026`.

## 6. Rollback

Re-add the domain to the Vercel project, put the Vercel DNS records back, remove the custom domain in Settings → Pages, delete the `CUSTOM_DOMAIN` variable and re-run Deploy. The site returns to `stevejrobertson.github.io/portfolio-website/`.
