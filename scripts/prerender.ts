import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Writes one HTML file per page into `dist` (SPEC §5), after `vite build` and
 * `vite build --ssr src/prerender.tsx --outDir dist-ssr`: `index.html` for 100,
 * `NNN/index.html` for the rest and `404.html` for the not-found page, so every
 * URL is a real file on GitHub Pages. Each gets its own title, description,
 * canonical link and Open Graph tags, and the page's text in `#root`.
 *
 * `SITE_URL` is the site's origin for absolute links (default: GitHub Pages).
 */

/** What `src/prerender.tsx` returns for each page. */
interface PrerenderedPage {
  page: number;
  file: string;
  href: string;
  title: string;
  description: string;
  body: string;
}

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const ssr = path.join(root, 'dist-ssr');

const SITE_URL = (process.env.SITE_URL ?? 'https://stevejrobertson.github.io').replace(/\/+$/, '');
const SITE_NAME = 'STEEVEFAX';
const SHARE_IMAGE = 'share.png';

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const META = /<!-- page-meta[\s\S]*?<!-- \/page-meta -->/;
const ROOT = '<div id="root"></div>';

const head = (page: PrerenderedPage, base: string) => {
  const url = `${SITE_URL}${page.href}`;
  const image = `${SITE_URL}${base}${SHARE_IMAGE}`;
  const tags = [
    `<title>${escape(page.title)}</title>`,
    `<meta name="description" content="${escape(page.description)}" />`,
    // The not-found page has no URL of its own
    ...(page.file === '404.html' ? ['<meta name="robots" content="noindex" />'] : [`<link rel="canonical" href="${url}" />`]),
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
  fs.rmSync(ssr, { recursive: true, force: true });
  console.log(`Pre-rendered ${pages.length} pages (base ${base}, site ${SITE_URL})`);
};

await main();
