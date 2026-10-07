import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { open } from './helpers';

// Flummox! on page 152, played as a visitor would (docs/flummox/PLAN.md §7)
const quiz = JSON.parse(readFileSync(new URL('../src/content/flummox/quiz.json', import.meta.url), 'utf-8')) as {
  questions: { answers: string[]; correct: number }[];
};
const KEYS = ['r', 'g', 'y', 'c'];
const right = (q: number) => KEYS[quiz.questions[q].correct];
const wrong = (q: number) => KEYS[(quiz.questions[q].correct + 1) % 4];

const mirror = (page: Page) => page.locator('#content');
const heading = (page: Page) => mirror(page).getByRole('heading', { level: 2 }).first();

test.describe('Flummox!', () => {
  test('plays a whole game by keyboard, with a wrong answer and the checkpoints', async ({ page, isMobile }) => {
    test.skip(isMobile, 'played by touch below');
    await open(page, '152/');
    await page.keyboard.press('r');
    await expect(heading(page)).toHaveText('Question 1 of 12');
    await page.keyboard.press(right(0));
    await expect(heading(page)).toHaveText('Correct!');
    await page.keyboard.press('r');
    await page.keyboard.press(wrong(1));
    await expect(heading(page)).toHaveText("Bad luck! You've been flummoxed!");
    await page.keyboard.press('r');
    await expect(heading(page)).toHaveText('Question 1 of 12');
    for (let q = 0; q < 12; q++) {
      await expect(heading(page)).toHaveText(`Question ${q + 1} of 12`);
      await page.keyboard.press(right(q));
      await page.keyboard.press('r');
      if (q === 3 || q === 7) {
        await expect(heading(page)).toHaveText('Checkpoint!');
        await page.keyboard.press('r');
      }
    }
    await expect(heading(page)).toHaveText('You beat Felix!');
    // Question 2 was answered wrong first time, so it scored nothing
    await expect(mirror(page)).toContainText('You got 11 of 12 right first time.');
  });

  test('plays by clicking the answers on screen', async ({ page }) => {
    await open(page, '152/');
    await page.locator('.fasttext-bar').getByRole('button').first().click();
    await expect(heading(page)).toHaveText('Question 1 of 12');
    const first = quiz.questions[0];
    await page.locator('.tt-line .tt-link', { hasText: first.answers[first.correct] }).click();
    await expect(heading(page)).toHaveText('Correct!');
  });

  test('plays in Text mode with Tab and Enter', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard journey');
    await open(page, '152/', { textMode: true });
    await page.getByRole('button', { name: 'Play' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 2, name: 'Question 1 of 12' })).toBeFocused();
    const answers = page.getByRole('group', { name: 'Answers' }).getByRole('button');
    await answers.nth(quiz.questions[0].correct).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 2, name: 'Correct!' })).toBeFocused();
    await expect(page.getByRole('status')).toHaveText('Correct! Score 1.');
  });

  test('offers to carry on after leaving mid-game', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard journey');
    await open(page, '152/');
    await page.keyboard.press('r');
    await page.keyboard.press(right(0));
    await page.keyboard.press('r');
    await page.keyboard.type('100');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Steve Robertson: Frontend Software Engineer');
    await page.keyboard.type('152');
    await expect(page).toHaveURL(/\/152\/$/);
    await expect(mirror(page)).toContainText('Welcome back! You were on question');
    await page.keyboard.press('r');
    await expect(heading(page)).toHaveText('Question 2 of 12');
  });

  test('shares a finished score from the list of networks', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard journey');
    // No share sheet, as on most desktops: Share opens the list instead
    await page.addInitScript(() => Object.defineProperty(navigator, 'share', { value: undefined }));
    await open(page, '152/');
    await page.keyboard.press('r');
    for (let q = 0; q < 12; q++) {
      await page.keyboard.press(right(q));
      await page.keyboard.press('r');
      if (q === 3 || q === 7) await page.keyboard.press('r');
    }
    await expect(heading(page)).toHaveText('You beat Felix!');
    await page.keyboard.press('y');
    await expect(heading(page)).toHaveText('Share your score');
    const links = mirror(page).getByRole('link', { name: /^Share on / });
    await expect(links).toHaveCount(7);
    const bluesky = await links.first().getAttribute('href');
    expect(decodeURIComponent(bluesky!)).toContain('12/12');
    expect(decodeURIComponent(bluesky!)).toContain('/152/score/12/');
  });

  test('takes a shared score link on to page 152', async ({ page }) => {
    await open(page, '152/score/9/');
    await expect(page).toHaveURL(/\/152\/$/);
    await expect(page).toHaveTitle('Flummox! (P152) | Steve Robertson');
  });
});
