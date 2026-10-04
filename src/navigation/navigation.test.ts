import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isPlainClick, pageFromPath, pageHref } from './paths';
import { DIGIT_DELAY_MS, useDigitBuffer } from './useDigitBuffer';
import { useHotkeys, type HotkeyHandlers } from './useHotkeys';
import { useNavigation } from './useNavigation';

const press = (key: string, init: KeyboardEventInit = {}, target: EventTarget = window) =>
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }));
  });

describe('paths', () => {
  it('builds and reads page URLs', () => {
    expect(pageHref(100)).toBe('/');
    expect(pageHref(110)).toBe('/110');
    expect(pageFromPath('/')).toBe(100);
    expect(pageFromPath('/110')).toBe(110);
    expect(pageFromPath('/512/')).toBe(512);
    expect(pageFromPath('/about')).toBe(404);
  });

  it('only treats an unmodified left click as plain', () => {
    const base = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };
    expect(isPlainClick(base)).toBe(true);
    expect(isPlainClick({ ...base, button: 1 })).toBe(false);
    expect(isPlainClick({ ...base, shiftKey: true })).toBe(false);
  });
});

describe('useNavigation', () => {
  beforeEach(() => window.history.replaceState(null, '', '/'));

  it('reads the first page from the URL without counting it as a change', () => {
    window.history.replaceState(null, '', '/200');
    const { result } = renderHook(() => useNavigation());
    expect(result.current).toMatchObject({ page: 200, changes: 0 });
  });

  it('redirects an unknown page to 404 without adding a history entry', () => {
    window.history.replaceState(null, '', '/942');
    const length = window.history.length;
    expect(renderHook(() => useNavigation()).result.current.page).toBe(404);
    expect(window.location.pathname).toBe('/404');
    expect(window.history.length).toBe(length);
  });

  it('redirects navigation to an unknown page to 404', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.navigate(512));
    expect(result.current.page).toBe(404);
    expect(window.location.pathname).toBe('/404');
  });

  it('pushes history on navigate and follows back and forward', () => {
    const { result } = renderHook(() => useNavigation());
    act(() => result.current.navigate(300));
    expect(window.location.pathname).toBe('/300');
    expect(result.current).toMatchObject({ page: 300, changes: 1 });

    act(() => {
      window.history.replaceState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(result.current).toMatchObject({ page: 100, changes: 2 });
  });
});

describe('useDigitBuffer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('shows partial digits, then navigates once after the third', () => {
    const navigate = vi.fn();
    const { result } = renderHook(() => useDigitBuffer(100, navigate));
    expect(result.current.text).toBe('P100');
    act(() => result.current.digit('3'));
    expect(result.current.text).toBe('P3--');
    act(() => result.current.digit('0'));
    act(() => result.current.digit('0'));
    act(() => result.current.digit('9')); // ignored while the third digit is pending
    expect(result.current.text).toBe('P300');
    expect(navigate).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(DIGIT_DELAY_MS));
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(300);
    expect(result.current.text).toBe('P100');
  });

  it('clears', () => {
    const navigate = vi.fn();
    const { result } = renderHook(() => useDigitBuffer(100, navigate));
    act(() => result.current.digit('2'));
    act(() => result.current.clear());
    act(() => vi.runAllTimers());
    expect(result.current.text).toBe('P100');
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe('useHotkeys', () => {
  const setup = (overrides: Partial<HotkeyHandlers> = {}) => {
    const handlers: HotkeyHandlers = {
      characterKeys: true,
      arrowKeys: true,
      onDigit: vi.fn(),
      onClear: vi.fn(),
      onFastext: vi.fn(),
      onSubpage: vi.fn(),
      ...overrides,
    };
    renderHook(() => useHotkeys(handlers));
    return handlers;
  };

  it('maps digits, Escape, R/G/Y/B/C and the arrows', () => {
    const h = setup();
    press('7');
    press('Escape');
    ['r', 'g', 'y', 'b', 'C'].forEach((key) => press(key));
    press('ArrowLeft');
    press('ArrowRight');
    expect(h.onDigit).toHaveBeenCalledWith('7');
    expect(h.onClear).toHaveBeenCalledTimes(1);
    expect(vi.mocked(h.onFastext).mock.calls).toEqual([[0], [1], [2], [3], [3]]);
    expect(vi.mocked(h.onSubpage).mock.calls).toEqual([[-1], [1]]);
  });

  it('ignores keys with modifiers so browser shortcuts still work', () => {
    const h = setup();
    press('r', { metaKey: true });
    press('r', { ctrlKey: true });
    press('1', { altKey: true });
    press('ArrowRight', { shiftKey: true });
    expect(h.onFastext).not.toHaveBeenCalled();
    expect(h.onDigit).not.toHaveBeenCalled();
    expect(h.onSubpage).not.toHaveBeenCalled();
  });

  it('ignores keys typed into form fields', () => {
    const h = setup();
    const input = document.body.appendChild(document.createElement('input'));
    press('1', {}, input);
    press('r', {}, input);
    input.remove();
    expect(h.onDigit).not.toHaveBeenCalled();
    expect(h.onFastext).not.toHaveBeenCalled();
  });

  it('can switch off character shortcuts and arrows separately', () => {
    const h = setup({ characterKeys: false, arrowKeys: false });
    press('1');
    press('r');
    press('ArrowRight');
    press('Escape');
    expect(h.onDigit).not.toHaveBeenCalled();
    expect(h.onFastext).not.toHaveBeenCalled();
    expect(h.onSubpage).not.toHaveBeenCalled();
    expect(h.onClear).toHaveBeenCalled();
  });
});
