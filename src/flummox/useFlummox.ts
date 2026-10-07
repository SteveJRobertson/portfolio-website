import { useCallback, useMemo, useState } from 'react';
import { gameReducer, restoreGame, type GameAction, type GameRules, type GameState } from './game';

/** The best score, per edition (SPEC §6). */
export const BEST_KEY = 'steevefax:flummox';
/** The game in progress, for this visit only. */
export const GAME_KEY = 'steevefax:flummox-game';

interface Saved<T> {
  edition: string;
  value: T;
}

/** Reads a value saved for this edition. Storage can be missing or throw (private windows, blocked site data). */
const load = <T>(storage: () => Storage, key: string, edition: string): T | undefined => {
  try {
    const saved = JSON.parse(storage().getItem(key) ?? 'null') as Saved<T> | null;
    return saved?.edition === edition ? saved.value : undefined;
  } catch {
    return undefined;
  }
};

const save = <T>(storage: () => Storage, key: string, edition: string, value: T) => {
  try {
    storage().setItem(key, JSON.stringify({ edition, value }));
  } catch {
    // Not saved, but the game still works for this visit.
  }
};

const local = () => window.localStorage;
const session = () => window.sessionStorage;

export const loadBest = (edition: string): number | undefined => {
  const best = load<unknown>(local, BEST_KEY, edition);
  return Number.isInteger(best) ? (best as number) : undefined;
};

export interface Flummox {
  game: GameState;
  /** The best score, counting a game just finished, or none yet. */
  best: number | undefined;
  /** The game just finished beat the best score. */
  newBest: boolean;
  dispatch: (action: GameAction) => void;
}

/** The game on page 152: the rules from `game.ts`, saved as SPEC §6 says. */
export const useFlummox = (edition: string, rules: GameRules): Flummox => {
  const reduce = useMemo(() => gameReducer(rules), [rules]);
  const count = rules.correct.length;
  const [game, setGame] = useState<GameState>(() => restoreGame(load(session, GAME_KEY, edition), count));
  const [best, setBest] = useState<number | undefined>(() => loadBest(edition));
  const [newBest, setNewBest] = useState(false);

  const dispatch = useCallback(
    (action: GameAction) => {
      const next = reduce(game, action);
      if (next === game) return;
      if (next.screen === 'finished') {
        const beat = best === undefined || next.score > best;
        setNewBest(beat);
        if (beat) {
          setBest(next.score);
          save(local, BEST_KEY, edition, next.score);
        }
      } else if (game.screen === 'finished') setNewBest(false);
      save(session, GAME_KEY, edition, next);
      setGame(next);
    },
    [reduce, game, best, edition],
  );

  return { game, best, newBest, dispatch };
};
