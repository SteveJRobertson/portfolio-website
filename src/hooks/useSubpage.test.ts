import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SUBPAGE_INTERVAL_MS, useSubpage } from './useSubpage';

const tick = (ms = SUBPAGE_INTERVAL_MS) => act(() => vi.advanceTimersByTime(ms));

describe('useSubpage', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

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

  it('goes back to the first sub-page and releases HOLD when the page changes', () => {
    const { result, rerender } = renderHook(({ page, count }) => useSubpage(page, count), {
      initialProps: { page: 110, count: 6 },
    });
    act(() => result.current.step(1));
    act(() => result.current.toggleHold());
    expect(result.current).toMatchObject({ index: 1, held: true });
    rerender({ page: 300, count: 3 });
    expect(result.current).toMatchObject({ index: 0, held: false });
  });

  it('does nothing on single pages', () => {
    const { result } = renderHook(() => useSubpage(100, 1));
    act(() => result.current.step(1));
    tick();
    expect(result.current.index).toBe(0);
  });

  it('cycles on a timer, wrapping round, and marks those steps as timed', () => {
    const { result } = renderHook(() => useSubpage(300, 3));
    tick(SUBPAGE_INTERVAL_MS - 1);
    expect(result.current.index).toBe(0);
    tick(1);
    expect(result.current).toMatchObject({ index: 1, auto: true });
    tick();
    tick();
    expect(result.current.index).toBe(0);
  });

  it('restarts the countdown after a manual step', () => {
    const { result } = renderHook(() => useSubpage(110, 6));
    tick(SUBPAGE_INTERVAL_MS - 1000);
    act(() => result.current.step(1));
    expect(result.current).toMatchObject({ index: 1, auto: false });
    tick(SUBPAGE_INTERVAL_MS - 1);
    expect(result.current.index).toBe(1);
    tick(1);
    expect(result.current.index).toBe(2);
  });

  it('stops while held and carries on when released', () => {
    const { result } = renderHook(() => useSubpage(110, 6));
    act(() => result.current.toggleHold());
    tick(SUBPAGE_INTERVAL_MS * 3);
    expect(result.current).toMatchObject({ index: 0, held: true });
    act(() => result.current.toggleHold());
    tick();
    expect(result.current).toMatchObject({ index: 1, held: false });
  });

  it('waits while paused without setting HOLD', () => {
    const { result, rerender } = renderHook(({ paused }) => useSubpage(110, 6, { paused }), { initialProps: { paused: true } });
    tick(SUBPAGE_INTERVAL_MS * 3);
    expect(result.current).toMatchObject({ index: 0, held: false });
    rerender({ paused: false });
    tick();
    expect(result.current.index).toBe(1);
  });

  it('opens each page held when asked (reduced motion)', () => {
    const { result, rerender } = renderHook(({ page }) => useSubpage(page, 6, { startHeld: true }), { initialProps: { page: 110 } });
    expect(result.current.held).toBe(true);
    act(() => result.current.toggleHold());
    rerender({ page: 300 });
    expect(result.current.held).toBe(true);
    tick();
    expect(result.current.index).toBe(0);
  });
});
