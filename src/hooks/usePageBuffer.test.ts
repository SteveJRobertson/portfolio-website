import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePageBuffer } from './usePageBuffer';

const press = (key: string, init: KeyboardEventInit = {}) =>
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, ...init }));
  });

describe('usePageBuffer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.history.replaceState(null, '', '/');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads the initial page from the URL path', () => {
    window.history.replaceState(null, '', '/200');
    const { result } = renderHook(() => usePageBuffer());
    expect(result.current.currentPage).toBe(200);
  });

  it('treats unknown paths as page 404', () => {
    window.history.replaceState(null, '', '/942');
    const { result } = renderHook(() => usePageBuffer());
    expect(result.current.currentPage).toBe(404);
  });

  it('shows partial digits in the header buffer', () => {
    const { result } = renderHook(() => usePageBuffer());
    press('3');
    expect(result.current.bufferText).toBe('P3--');
    press('0');
    expect(result.current.bufferText).toBe('P30-');
  });

  it('navigates and updates the URL after the third digit', () => {
    const { result } = renderHook(() => usePageBuffer());
    press('3');
    press('0');
    press('0');
    act(() => {
      vi.runAllTimers();
    });
    expect(result.current.currentPage).toBe(300);
    expect(window.location.pathname).toBe('/300');
  });

  it('clears the buffer on Escape', () => {
    const { result } = renderHook(() => usePageBuffer());
    press('2');
    press('Escape');
    expect(result.current.bufferText).toBe('P100');
  });

  it('ignores digits typed with a modifier key', () => {
    const { result } = renderHook(() => usePageBuffer());
    press('1', { metaKey: true });
    press('2', { ctrlKey: true });
    expect(result.current.bufferText).toBe('P100');
  });
});
