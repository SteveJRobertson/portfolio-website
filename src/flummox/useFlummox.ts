import { useCallback, useMemo, useState } from 'react';
import { track } from '../analytics/track';
import { gameReducer, restoreGame, type GameAction, type GameRules, type GameState } from './game';

/**
 * The best score for each edition (SPEC §6), as `{ "best": { "Autumn 2026": 9 } }`,
 * so the regular best is still there after a special. Older visits saved
 * one edition's, as `{ "edition": …, "value": … }`, which still reads.
 */
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

const loadBests = (): Record<string, unknown> => {
  try {
    const saved = JSON.parse(local().getItem(BEST_KEY) ?? 'null') as { best?: unknown; edition?: unknown; value?: unknown } | null;
    if (saved && typeof saved.best === 'object' && saved.best !== null) return saved.best as Record<string, unknown>;
    if (saved && typeof saved.edition === 'string') return { [saved.edition]: saved.value };
  } catch {
    // Nothing saved that can be read
  }
  return {};
};

export const loadBest = (edition: string): number | undefined => {
  const best = loadBests()[edition];
  return Number.isInteger(best) ? (best as number) : undefined;
};

const saveBest = (edition: string, score: number) => {
  try {
    local().setItem(BEST_KEY, JSON.stringify({ best: { ...loadBests(), [edition]: score } }));
  } catch {
    // Not saved, but the game still works for this visit.
  }
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
export const useFlummox = (edition: string, rules: GameRules, onChange?: (next: GameState) => void): Flummox => {
  const reduce = useMemo(() => gameReducer(rules), [rules]);
  const count = rules.correct.length;
  const [game, setGame] = useState<GameState>(() => restoreGame(load(session, GAME_KEY, edition), count));
  const [best, setBest] = useState<number | undefined>(() => loadBest(edition));
  const [newBest, setNewBest] = useState(false);

  const dispatch = useCallback(
    (action: GameAction) => {
      const next = reduce(game, action);
      if (next === game) return;
      const ended = (screen: GameState['screen']) => screen === 'finished' || screen === 'share';
      // What's counted (analytics SPEC §4.2): games begun, where people get flummoxed, and scores
      if (next.screen === 'question' && next.question === 0 && (!game.underWay || action.type === 'restart')) track('Flummox start', { edition });
      if (next.screen === 'flummoxed') track('Flummox flummoxed', { edition, question: game.question + 1 });
      if (next.screen === 'finished' && !ended(game.screen)) track('Flummox finish', { edition, score: next.score });
      if (next.screen === 'finished' && !ended(game.screen)) {
        const beat = best === undefined || next.score > best;
        setNewBest(beat);
        if (beat) {
          setBest(next.score);
          saveBest(edition, next.score);
        }
      } else if (!ended(next.screen)) setNewBest(false);
      save(session, GAME_KEY, edition, next);
      setGame(next);
      onChange?.(next);
    },
    [reduce, game, best, edition, onChange],
  );

  return { game, best, newBest, dispatch };
};
