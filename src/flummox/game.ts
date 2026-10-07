/**
 * The Flummox! rules (docs/flummox/SPEC.md §5 and §6) as a pure reducer, so
 * every rule is tested without React. `useFlummox` keeps the state and saves it.
 */

export type GameScreen = 'intro' | 'question' | 'correct' | 'flummoxed' | 'checkpoint' | 'finished';

export interface GameState {
  screen: GameScreen;
  /** The question being asked, or the next one to ask (0-based). */
  question: number;
  score: number;
  /** Questions answered at least once this game, right or wrong: asked again, they score nothing. */
  answered: boolean[];
  /** Whether the last right answer scored, for "+1 POINT". */
  scored: boolean;
  /** A game has started and isn't finished, so the intro offers to carry on. */
  underWay: boolean;
}

/** What the rules need from the quiz. */
export interface GameRules {
  /** Each question's right answer, 0 (red) to 3 (cyan). */
  correct: number[];
  /** Index of the first question of each stage, e.g. [0, 4, 8]. */
  stages: number[];
}

export type GameAction =
  | { type: 'open' }
  | { type: 'play' }
  | { type: 'answer'; slot: number }
  | { type: 'next' }
  | { type: 'retry' }
  | { type: 'restart' };

export const newGame = (count: number): GameState => ({
  screen: 'intro',
  question: 0,
  score: 0,
  answered: Array.from({ length: count }, () => false),
  scored: false,
  underWay: false,
});

/** The stage a question is in: 0 before the first checkpoint, and so on. */
export const stageOf = (stages: number[], question: number): number => stages.filter((s) => s <= question).length - 1;

const start = (count: number): GameState => ({ ...newGame(count), screen: 'question', underWay: true });

export const gameReducer =
  (rules: GameRules) =>
  (state: GameState, action: GameAction): GameState => {
    const count = rules.correct.length;
    switch (action.type) {
      case 'open':
        return { ...state, screen: 'intro' };

      case 'play':
        if (state.screen !== 'intro') return state;
        return state.underWay ? { ...state, screen: 'question' } : start(count);

      case 'restart':
        return start(count);

      case 'answer': {
        if (state.screen !== 'question') return state;
        const q = state.question;
        const answered = state.answered.map((a, i) => a || i === q);
        if (action.slot === rules.correct[q]) {
          const scored = !state.answered[q];
          return { ...state, screen: 'correct', answered, scored, score: state.score + (scored ? 1 : 0) };
        }
        return { ...state, screen: 'flummoxed', answered, question: rules.stages[stageOf(rules.stages, q)] };
      }

      case 'next': {
        if (state.screen === 'checkpoint') return { ...state, screen: 'question' };
        if (state.screen !== 'correct') return state;
        const question = state.question + 1;
        if (question >= count) return { ...state, screen: 'finished', underWay: false };
        return { ...state, question, screen: rules.stages.includes(question) ? 'checkpoint' : 'question' };
      }

      case 'retry':
        return state.screen === 'flummoxed' ? { ...state, screen: 'question' } : state;
    }
  };

/** Reads a saved game back, or a new one if it is missing or doesn't fit this quiz. */
export const restoreGame = (saved: unknown, count: number): GameState => {
  const fresh = newGame(count);
  if (!saved || typeof saved !== 'object') return fresh;
  const s = saved as Partial<Record<keyof GameState, unknown>>;
  const screens: GameScreen[] = ['intro', 'question', 'correct', 'flummoxed', 'checkpoint', 'finished'];
  const ok =
    screens.includes(s.screen as GameScreen) &&
    Number.isInteger(s.question) &&
    (s.question as number) >= 0 &&
    (s.question as number) < count &&
    Number.isInteger(s.score) &&
    (s.score as number) >= 0 &&
    (s.score as number) <= count &&
    Array.isArray(s.answered) &&
    s.answered.length === count &&
    s.answered.every((a) => typeof a === 'boolean') &&
    typeof s.scored === 'boolean' &&
    typeof s.underWay === 'boolean';
  return ok ? (s as GameState) : fresh;
};
