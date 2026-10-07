import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { MANIFEST, SHARE_DIR, shareCards, shareCardsHash } from './lib/shareCards.ts';

/**
 * Captures the Flummox! link-preview pictures (docs/flummox/SPEC.md §6) from
 * the `Flummox/Card` story into public/share/, and records what they were made
 * from in its manifest. Run `npm run build-storybook` first, then
 * `npm run share-images`. CI's "Update share images" workflow does both in the
 * Playwright image, so the font renders as it does for the screenshots.
 */
const root = path.resolve(import.meta.dirname, '../storybook-static');
if (!fs.existsSync(path.join(root, 'iframe.html'))) throw new Error('storybook-static is missing: run npm run build-storybook first');

const TYPES: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' }).end(fs.readFileSync(file));
});
await new Promise<void>((resolve) => server.listen(0, resolve));
const { port } = server.address() as { port: number };

const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, reducedMotion: 'reduce' });
fs.mkdirSync(SHARE_DIR, { recursive: true });
for (const { card, file } of shareCards()) {
  await page.goto(`http://localhost:${port}/iframe.html?id=flummox-card--card&viewMode=story&args=card:${card}`);
  const frame = page.locator(`.flummox-card[data-card="${card}"]`);
  await frame.waitFor();
  await page.evaluate('document.fonts.ready');
  await frame.screenshot({ path: path.join(SHARE_DIR, file) });
  console.log(`Wrote public/share/${file}`);
}
await browser.close();
server.close();
fs.writeFileSync(MANIFEST, `${JSON.stringify({ hash: shareCardsHash() }, null, 2)}\n`);
console.log('Wrote public/share/manifest.json');
