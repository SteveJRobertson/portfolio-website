import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { PAGES, open, pagePath } from './helpers';

const firstAnswer = (JSON.parse(readFileSync(new URL('../src/content/flummox/quiz.json', import.meta.url), 'utf-8')) as { questions: { correct: number }[] })
  .questions[0].correct;
const KEYS = ['r', 'g', 'y', 'c'];

// Each page as it ships, at each screen size. Update the baselines with the "Update visual baselines" workflow.
test.describe('screenshots', () => {
  for (const number of PAGES) {
    test(`page ${number}`, async ({ page }) => {
      await open(page, pagePath(number));
      await expect(page).toHaveScreenshot(`p${number}.png`);
    });
  }

  test('not-found page', async ({ page }) => {
    await open(page, '942/');
    await expect(page).toHaveScreenshot('p404.png');
  });

  // Reduced motion starts with the CRT effect off, so the pages above are without it
  test('CRT effect on', async ({ page }) => {
    await open(page, '', { crt: true });
    await expect(page).toHaveScreenshot('p100-crt.png');
  });

  test('Flummox! question', async ({ page }) => {
    await open(page, '152/');
    await page.keyboard.press('r');
    await expect(page).toHaveScreenshot('p152-question.png');
  });

  test('Flummox! flummoxed', async ({ page }) => {
    await open(page, '152/');
    await page.keyboard.press('r');
    await page.keyboard.press(KEYS[(firstAnswer + 1) % 4]);
    await expect(page).toHaveScreenshot('p152-flummoxed.png');
  });

  test('Text mode', async ({ page }) => {
    await open(page, '110/', { textMode: true });
    await expect(page).toHaveScreenshot('p110-text.png');
  });
});
