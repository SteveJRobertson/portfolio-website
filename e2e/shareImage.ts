import path from 'node:path';
import { chromium } from '@playwright/test';

/**
 * Captures `public/share.png`, the 1200 × 630 link-preview image, from page 100
 * of a running preview (`GITHUB_PAGES=true npm run build && GITHUB_PAGES=true npx vite preview`), then
 * `npx tsx e2e/shareImage.ts [url]`. Run it again when page 100 changes.
 */
const url = process.argv[2] ?? 'http://localhost:4173/';
const out = path.resolve(import.meta.dirname, '../public/share.png');

const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, reducedMotion: 'reduce' });
await page.addInitScript(() => window.localStorage.setItem('steve-text:settings', JSON.stringify({ crt: false })));
await page.goto(url);
// Just the screen: the remote button under it means nothing in a link preview
await page.addStyleTag({ content: '.control-strip { display: none !important; }' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out });
await browser.close();
console.log(`Wrote ${path.relative(process.cwd(), out)}`);
