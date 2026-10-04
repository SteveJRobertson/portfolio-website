import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, SETTINGS_KEY, loadSettings, useSettings } from './useSettings';

describe('useSettings', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('defaults to the Teletext view with shortcuts on', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('remembers a change', () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current[1]({ textMode: true }));
    expect(result.current[0]).toEqual({ textMode: true, shortcuts: true });
    expect(loadSettings()).toEqual({ textMode: true, shortcuts: true });
  });

  it('ignores saved values of the wrong type', () => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ textMode: 'yes', shortcuts: false }));
    expect(loadSettings()).toEqual({ textMode: false, shortcuts: false });
    window.localStorage.setItem(SETTINGS_KEY, 'not json');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('still works when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { result } = renderHook(() => useSettings());
    expect(result.current[0]).toEqual(DEFAULT_SETTINGS);
    act(() => result.current[1]({ shortcuts: false }));
    expect(result.current[0].shortcuts).toBe(false);
  });
});
