import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Writes one HTML file per page into `dist` (SPEC §5), after `vite build` and
 * `vite build --ssr src/prerender.tsx --outDir dist-ssr`: `index.html` for 100,
 * `NNN/index.html` for the rest and `404.html` for the not-found page, so every
 * URL is a real file on GitHub Pages. Each gets its own title, description,
 * canonical link and Open Graph tags, and the page's text in `#root`. The
 * index also gets JSON-LD describing Steve and the site. Then `sitemap.xml`
 * lists every page but 404, and at the root of a domain `robots.txt` points
 * search engines at it (SEO SPEC §3.2).
 *
 * `SITE_URL` is the site's origin for absolute links (default: the live site, steverobertson.dev).
 */

/** What `src/prerender.tsx` returns for each page. */
interface PrerenderedPage {
  page: number;
  file: string;
  href: string;
  title: string;
  description: string;
  body: string;
  canonical?: string;
  noindex?: boolean;
}

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const ssr = path.join(root, 'dist-ssr');

const SITE_URL = (process.env.SITE_URL ?? 'https://steverobertson.dev').replace(/\/+$/, '');
const SITE_NAME = 'STEEVEFAX';
const SHARE_IMAGE = 'share.png';

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Who the site is about, for search engines (schema.org `Person`). */
const PERSON = {
  name: 'Steve Robertson',
  jobTitle: 'Frontend Software Engineer',
  worksFor: 'Motability Operations',
  locality: 'Edinburgh',
  region: 'Scotland',
  country: 'GB',
  knowsAbout: ['React', 'TypeScript', 'JavaScript', 'Design systems', 'Accessibility'],
  sameAs: ['https://www.linkedin.com/in/steverobertson80', 'https://github.com/stevejrobertson'],
};

/** The index's structured data: Steve as a `Person` and the site as a `WebSite` by him. */
const structuredData = (home: string) => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': `${home}#person`,
      name: PERSON.name,
      url: home,
      jobTitle: PERSON.jobTitle,
      worksFor: { '@type': 'Organization', name: PERSON.worksFor },
      address: { '@type': 'PostalAddress', addressLocality: PERSON.locality, addressRegion: PERSON.region, addressCountry: PERSON.country },
      knowsAbout: PERSON.knowsAbout,
      sameAs: PERSON.sameAs,
    },
    {
      '@type': 'WebSite',
      '@id': `${home}#website`,
      name: SITE_NAME,
      alternateName: `${PERSON.name}'s portfolio`,
      url: home,
      inLanguage: 'en-GB',
      author: { '@id': `${home}#person` },
    },
  ],
});

/** JSON for inside a `<script>`: `<` is escaped so the text can't close the element. */
const scriptJson = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');

/** The day the page's content file last changed, from git; none when git can't say (no history, no git). */
const lastModified = (page: number): string | undefined => {
  try {
    const date = execFileSync('git', ['log', '-1', '--format=%cs', '--', `src/content/pages/page${page}.json`], { cwd: root, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
  } catch {
    return undefined;
  }
};

const sitemap = (pages: PrerenderedPage[]) =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...pages
      .filter((page) => page.file !== '404.html' && !page.noindex)
      .map((page) => {
        const lastmod = lastModified(page.page);
        return `  <url><loc>${escape(`${SITE_URL}${page.href}`)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
      }),
    '</urlset>',
    '',
  ].join('\n');

const META = /<!-- page-meta[\s\S]*?<!-- \/page-meta -->/;
const ROOT = '<div id="root"></div>';

const head = (page: PrerenderedPage, base: string) => {
  const url = `${SITE_URL}${page.href}`;
  const image = `${SITE_URL}${base}${SHARE_IMAGE}`;
  const tags = [
    `<title>${escape(page.title)}</title>`,
    `<meta name="description" content="${escape(page.description)}" />`,
    // The not-found page has no URL of its own; a Flummox! score page is page 152's, kept out of search
    ...(page.file === '404.html' ? [] : [`<link rel="canonical" href="${SITE_URL}${page.canonical ?? page.href}" />`]),
    ...(page.file === '404.html' || page.noindex ? ['<meta name="robots" content="noindex" />'] : []),
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escape(page.title)}" />`,
    `<meta property="og:description" content="${escape(page.description)}" />`,
    ...(page.file === '404.html' ? [] : [`<meta property="og:url" content="${url}" />`]),
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="The STEEVEFAX index page: Steve Robertson's name in Teletext block letters." />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    ...(page.file === 'index.html' ? [`<script type="application/ld+json">${scriptJson(structuredData(url))}</script>`] : []),
  ];
  return tags.join('\n    ');
};

const main = async () => {
  const entry = path.join(ssr, 'prerender.js');
  if (!fs.existsSync(entry)) throw new Error(`${path.relative(root, entry)} is missing: run the SSR build first`);
  const { prerender } = (await import(pathToFileURL(entry).href)) as { prerender: () => PrerenderedPage[] };

  const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf-8');
  if (!META.test(template) || !template.includes(ROOT)) throw new Error('dist/index.html is missing the page-meta block or #root');
  // The built HTML's own asset links start with the base, e.g. /portfolio-website/assets/…
  const base = /src="([^"]*?)assets\//.exec(template)?.[1] ?? '/';

  const pages = prerender();
  for (const page of pages) {
    const html = template.replace(META, () => head(page, base)).replace(ROOT, () => `<div id="root">${page.body}</div>`);
    const file = path.join(dist, page.file);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
  }
  fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap(pages));
  // robots.txt only counts at the root of a host, so it's written only for a custom domain
  const robots = base === '/';
  if (robots) fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}${base}sitemap.xml\n`);
  fs.rmSync(ssr, { recursive: true, force: true });
  console.log(`Pre-rendered ${pages.length} pages and the sitemap${robots ? ' and robots.txt' : ''} (base ${base}, site ${SITE_URL})`);
};

await main();
