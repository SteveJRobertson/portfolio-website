import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useSubpage } from './useSubpage';

describe('useSubpage', () => {
  it('steps and wraps round', () => {
    const { result } = renderHook(() => useSubpage(110, 3));
    act(() => result.current.step(1));
    expect(result.current.index).toBe(1);
    act(() => result.current.step(-1));
    act(() => result.current.step(-1));
    expect(result.current.index).toBe(2);
  });

  it('jumps straight to a sub-page, ignoring ones that do not exist', () => {
    const { result } = renderHook(() => useSubpage(110, 6));
    act(() => result.current.show(4));
    expect(result.current.index).toBe(4);
    act(() => result.current.show(9));
    expect(result.current.index).toBe(4);
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

  it('does nothing on single pages', () => {
    const { result } = renderHook(() => useSubpage(100, 1));
    act(() => result.current.step(1));
    expect(result.current.index).toBe(0);
  });
});
