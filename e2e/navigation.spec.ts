import { expect, test } from '@playwright/test';
import { BASE, open } from './helpers';

test.describe('navigation', () => {
  test('opens the index at the base path', async ({ page }) => {
    await open(page, '');
    await expect(page).toHaveTitle('Steve Robertson: Frontend Software Engineer (P100)');
    const hrefs = await page.getByRole('navigation', { name: 'Fastext' }).getByRole('link').evaluateAll((links) => links.map((a) => a.getAttribute('href')));
    expect(hrefs).toHaveLength(4);
    for (const href of hrefs) expect(href).toMatch(new RegExp(`^${BASE}\\d{3}/$`));
  });

  test('goes to a page typed on the keyboard', async ({ page, isMobile }) => {
    test.skip(isMobile, 'covered by the remote test');
    await open(page, '');
    await page.keyboard.type('110');
    await expect(page).toHaveURL(`${BASE}110/`);
    await expect(page).toHaveTitle('Experience (P110) | Steve Robertson');
  });

  test('goes to a page from the remote keypad', async ({ page }) => {
    await open(page, '');
    await page.getByRole('button', { name: 'REMOTE' }).click();
    const remote = page.getByRole('group', { name: 'Remote handset' });
    for (const digit of ['4', '0', '0']) await remote.getByRole('button', { name: digit, exact: true }).click();
    await expect(page).toHaveURL(`${BASE}400/`);
  });

  test('follows each Fastext button', async ({ page }) => {
    await open(page, '');
    const links = page.getByRole('navigation', { name: 'Fastext' }).getByRole('link');
    for (let i = 0; i < 4; i++) {
      const href = await links.nth(i).getAttribute('href');
      await links.nth(i).click();
      await expect(page).toHaveURL(href!);
      await page.goBack();
      await expect(page).toHaveURL(BASE);
    }
  });

  test('opens and reloads a page from its own URL', async ({ page }) => {
    await open(page, '110/');
    await expect(page).toHaveTitle('Experience (P110) | Steve Robertson');
    await page.reload();
    await expect(page).toHaveTitle('Experience (P110) | Steve Robertson');
    await expect(page).toHaveURL(`${BASE}110/`);
  });

  test('accepts a page URL without the trailing slash', async ({ page }) => {
    await open(page, '300');
    await expect(page).toHaveTitle('Skills (P300) | Steve Robertson');
  });

  test('keeps back and forward in step', async ({ page }) => {
    await open(page, '');
    await page.getByRole('navigation', { name: 'Fastext' }).getByRole('link').first().click();
    await expect(page).toHaveURL(`${BASE}101/`);
    await page.goBack();
    await expect(page).toHaveTitle('Steve Robertson: Frontend Software Engineer (P100)');
    await page.goForward();
    await expect(page).toHaveTitle('About me (P101) | Steve Robertson');
  });

  test('sends an unknown page to the not-found page', async ({ page }) => {
    await open(page, '942/');
    await expect(page).toHaveURL(`${BASE}404/`);
    await expect(page).toHaveTitle(/Page not found/);
  });
});

test.describe('pre-rendered pages', () => {
  test.use({ javaScriptEnabled: false });

  test('serve their content, title and canonical link without JavaScript', async ({ page }) => {
    await page.goto('110/');
    await expect(page).toHaveTitle('Experience (P110) | Steve Robertson');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Experience');
    await expect(page.getByRole('heading', { name: 'FanDuel' })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://stevejrobertson.github.io/portfolio-website/110/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/portfolio-website\/share\.png$/);
  });

  test('describe Steve to search engines on the index', async ({ page }) => {
    await page.goto('');
    const json = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    expect(json['@graph'].map((item: { '@type': string }) => item['@type'])).toEqual(['Person', 'WebSite']);
    expect(json['@graph'][0]).toMatchObject({ name: 'Steve Robertson', url: 'https://stevejrobertson.github.io/portfolio-website/' });
  });

  test('are all in the sitemap but 404', async ({ request }) => {
    const xml = await (await request.get('sitemap.xml')).text();
    expect(xml).toContain('<loc>https://stevejrobertson.github.io/portfolio-website/</loc>');
    expect(xml).toContain('<loc>https://stevejrobertson.github.io/portfolio-website/110/</loc>');
    expect(xml).not.toContain('/404');
  });

  test('link to each other under the base path', async ({ page }) => {
    await page.goto('');
    await page.getByRole('navigation', { name: 'All pages' }).getByRole('link', { name: /^400 / }).click();
    await expect(page).toHaveURL(`${BASE}400/`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Contact');
  });
});
