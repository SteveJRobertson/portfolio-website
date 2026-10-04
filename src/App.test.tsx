import { act, fireEvent, render, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { NAVIGABLE_PAGES } from './content/registry';
import { DIGIT_DELAY_MS } from './navigation/useDigitBuffer';
import { SETTINGS_KEY } from './settings/useSettings';

const press = (key: string) =>
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  });

const renderAt = (path: string, settings?: object) => {
  window.history.replaceState(null, '', path);
  if (settings) window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  return render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
};

const heading = () => screen.getByRole('heading', { level: 1 });

/** axe on the whole document. jsdom can't compute colours, so contrast is covered by contrast.test.ts instead. */
const axeViolations = async () => {
  document.documentElement.lang = 'en'; // as in index.html
  const results = await axe.run(document, { rules: { 'color-contrast': { enabled: false } } });
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

describe('App', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] }));
  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it('does not move focus on first load', () => {
    renderAt('/101');
    expect(heading()).toHaveProperty('textContent', 'About me');
    expect(document.activeElement).toBe(document.body);
    expect(document.title).toBe('P101 About me | Steve Robertson');
  });

  it('navigates once from digits typed on the keyboard and keypad together, and focuses the new heading', () => {
    renderAt('/');
    const pushState = vi.spyOn(window.history, 'pushState');
    press('1');
    fireEvent.click(screen.getByRole('button', { name: 'REMOTE' }));
    const remote = screen.getByRole('group', { name: 'Remote handset' });
    fireEvent.click(within(remote).getByRole('button', { name: '1' }));
    fireEvent.click(within(remote).getByRole('button', { name: '0' }));
    act(() => vi.advanceTimersByTime(DIGIT_DELAY_MS));
    expect(window.location.pathname).toBe('/110');
    expect(pushState).toHaveBeenCalledTimes(1);
    expect(heading().textContent).toBe('Experience');
    expect(document.activeElement).toBe(heading());
  });

  it('follows the Fastext hotkeys and links', () => {
    renderAt('/');
    press('g');
    expect(window.location.pathname).toBe('/110');
    fireEvent.click(screen.getByRole('link', { name: 'Yellow: SKILLS, page 300' }));
    expect(window.location.pathname).toBe('/300');
  });

  it('redirects an unknown page to 404, from the URL or the digits', () => {
    renderAt('/512');
    expect(window.location.pathname).toBe('/404');
    expect(heading().textContent).toBe('Page not found');

    press('5');
    press('1');
    press('3');
    act(() => vi.advanceTimersByTime(DIGIT_DELAY_MS));
    expect(window.location.pathname).toBe('/404');
    expect(heading().textContent).toBe('Page not found');
  });

  it('puts every sub-page in the mirror and announces sub-page steps', () => {
    renderAt('/110');
    expect(screen.getAllByRole('region', { name: /^Part \d of 6$/ })).toHaveLength(6);
    expect(screen.getByRole('heading', { level: 2, name: 'Aegon' })).toBeTruthy();
    press('ArrowRight');
    expect(screen.getByRole('status').textContent).toBe('Part 2 of 6');
  });

  it('keeps the grid out of the accessibility tree, apart from the Fastext links', () => {
    const { container } = renderAt('/');
    const screenEl = container.querySelector('.teletext-screen')!;
    const exposed = [...screenEl.querySelectorAll('*')].filter((el) => !el.closest('[aria-hidden="true"]'));
    expect(exposed.every((el) => el.closest('nav[aria-label="Fastext"]') || el.classList.contains('tt-grid'))).toBe(true);
    expect(screenEl.querySelectorAll('[aria-hidden="true"] a, [aria-hidden="true"] button, [aria-hidden="true"] [tabindex]')).toHaveLength(0);
  });

  it('switches to Text mode from 888, remembers it, and switches back', () => {
    renderAt('/888');
    fireEvent.click(screen.getByRole('button', { name: /TEXT MODE/ }));
    expect(document.querySelector('.teletext-screen')).toBeNull();
    expect(document.activeElement).toBe(heading());
    expect(JSON.parse(window.localStorage.getItem(SETTINGS_KEY)!)).toMatchObject({ textMode: true });
    expect(screen.getByRole('button', { name: /TEXT MODE/ }).getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'TELETEXT VIEW' }));
    expect(document.querySelector('.teletext-screen')).not.toBeNull();
  });

  it('can turn the number and letter shortcuts off', () => {
    renderAt('/888');
    fireEvent.click(screen.getByRole('button', { name: /SHORTCUTS/ }));
    press('r');
    press('1');
    expect(window.location.pathname).toBe('/888');
    expect(screen.getByRole('button', { name: /SHORTCUTS/ }).getAttribute('aria-pressed')).toBe('false');
  });
});

describe('axe', () => {
  afterEach(() => window.localStorage.clear());

  it.each([...NAVIGABLE_PAGES, 512])('finds no violations on page %i', async (page) => {
    renderAt(`/${page}`);
    expect(await axeViolations()).toEqual([]);
  });

  it.each([...NAVIGABLE_PAGES, 512])('finds no violations on page %i in Text mode', async (page) => {
    renderAt(`/${page}`, { textMode: true });
    expect(await axeViolations()).toEqual([]);
  });

  it('finds no violations with the remote open', async () => {
    renderAt('/');
    fireEvent.click(screen.getByRole('button', { name: 'REMOTE' }));
    expect(await axeViolations()).toEqual([]);
  });
});
