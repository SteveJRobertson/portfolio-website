import type { Page } from '@playwright/test';

export const BASE = '/';

/** Every page in the registry, and the not-found page. */
export const PAGES = [100, 101, 110, 200, 201, 202, 203, 300, 400, 888];

/** A fixed time, so the header clock is the same in every screenshot. */
const NOW = new Date('2026-10-05T19:30:00+01:00');

export const pagePath = (page: number) => (page === 100 ? '' : `${page}/`);

/** Opens a page with the clock fixed and the Teletext font loaded. `settings` are saved before the app starts. */
export const open = async (page: Page, path: string, settings?: Record<string, unknown>) => {
  await page.clock.setFixedTime(NOW);
  if (settings) {
    await page.addInitScript((value) => window.localStorage.setItem('steve-text:settings', value), JSON.stringify(settings));
  }
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
};
