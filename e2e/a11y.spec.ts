import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { PAGES, open, pagePath } from './helpers';

// Axe in a real browser, so colour contrast is checked too (jsdom can't compute it; DEC-012).
// Mosaic cells (`m-bg-*`: banner block letters and pictures) are left out: each is one sixth-of-a-cell
// pixel pattern that axe would judge as tiny text. Banner contrast is checked at 3:1 for large text in
// contrast.test.ts instead.
const MOSAIC = '[class*="m-bg-"]';
for (const textMode of [false, true]) {
  test.describe(textMode ? 'Text mode' : 'Teletext view', () => {
    for (const number of PAGES) {
      test(`page ${number} has no axe violations`, async ({ page }) => {
        await open(page, pagePath(number), textMode ? { textMode: true } : undefined);
        const results = await new AxeBuilder({ page }).exclude(MOSAIC).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
      });
    }
  });
}
