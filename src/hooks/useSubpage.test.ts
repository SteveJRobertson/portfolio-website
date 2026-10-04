import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useSubpage } from './useSubpage';

const press = (key: string, init: KeyboardEventInit = {}) =>
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, ...init }));
  });

describe('useSubpage', () => {
  it('steps with the arrow keys and wraps round', () => {
    const { result } = renderHook(() => useSubpage(110, 3));
    press('ArrowRight');
    expect(result.current.index).toBe(1);
    press('ArrowLeft');
    press('ArrowLeft');
    expect(result.current.index).toBe(2);
  });

  it('goes back to the first sub-page when the page changes', () => {
    const { result, rerender } = renderHook(({ page, count }) => useSubpage(page, count), {
      initialProps: { page: 110, count: 6 },
    });
    act(() => result.current.step(1));
    expect(result.current.index).toBe(1);
    rerender({ page: 300, count: 3 });
    expect(result.current.index).toBe(0);
  });

  it('ignores arrows on single pages and with modifier keys', () => {
    const { result } = renderHook(() => useSubpage(110, 6));
    press('ArrowRight', { altKey: true });
    expect(result.current.index).toBe(0);
    const single = renderHook(() => useSubpage(100, 1));
    press('ArrowRight');
    expect(single.result.current.index).toBe(0);
  });
});
