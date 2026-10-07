import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BEST_KEY, GAME_KEY, loadBest, useFlummox } from './useFlummox';
import type { GameAction, GameRules } from './game';

// Four questions, all answered red, one stage
const rules: GameRules = { correct: [0, 0, 0, 0], stages: [0] };
const right: GameAction = { type: 'answer', slot: 0 };
const wrong: GameAction = { type: 'answer', slot: 1 };
const next: GameAction = { type: 'next' };

describe('useFlummox', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('keeps the game in progress for the visit', () => {
    const first = renderHook(() => useFlummox('Autumn', rules));
    act(() => first.result.current.dispatch({ type: 'play' }));
    act(() => first.result.current.dispatch(right));
    const again = renderHook(() => useFlummox('Autumn', rules));
    expect(again.result.current.game).toMatchObject({ screen: 'correct', score: 1 });
  });

  it('saves a new best score and says so', () => {
    const { result } = renderHook(() => useFlummox('Autumn', rules));
    expect(result.current.best).toBeUndefined();
    act(() => result.current.dispatch({ type: 'play' }));
    for (let i = 0; i < 4; i++) {
      act(() => result.current.dispatch(right));
      act(() => result.current.dispatch(next));
    }
    expect(result.current).toMatchObject({ game: { screen: 'finished', score: 4 }, best: 4, newBest: true });
    expect(loadBest('Autumn')).toBe(4);
  });

  it('keeps the old best when a game scores less', () => {
    window.localStorage.setItem(BEST_KEY, JSON.stringify({ edition: 'Autumn', value: 4 }));
    const { result } = renderHook(() => useFlummox('Autumn', rules));
    act(() => result.current.dispatch({ type: 'play' }));
    act(() => result.current.dispatch(wrong));
    act(() => result.current.dispatch({ type: 'retry' }));
    for (let i = 0; i < 4; i++) {
      act(() => result.current.dispatch(right));
      act(() => result.current.dispatch(next));
    }
    expect(result.current).toMatchObject({ game: { screen: 'finished', score: 3 }, best: 4, newBest: false });
    expect(loadBest('Autumn')).toBe(4);
  });

  it('starts a new best and a new game for a new edition', () => {
    window.localStorage.setItem(BEST_KEY, JSON.stringify({ edition: 'Summer', value: 9 }));
    window.sessionStorage.setItem(GAME_KEY, JSON.stringify({ edition: 'Summer', value: { screen: 'question' } }));
    const { result } = renderHook(() => useFlummox('Autumn', rules));
    expect(result.current.best).toBeUndefined();
    expect(result.current.game.screen).toBe('intro');
  });

  it('still plays when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { result } = renderHook(() => useFlummox('Autumn', rules));
    act(() => result.current.dispatch({ type: 'play' }));
    act(() => result.current.dispatch(right));
    expect(result.current.game).toMatchObject({ screen: 'correct', score: 1 });
  });
});
