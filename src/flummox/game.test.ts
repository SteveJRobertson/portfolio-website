import { describe, expect, it } from 'vitest';
import { gameReducer, newGame, restoreGame, stageOf, type GameAction, type GameState } from './game';

// 12 questions, all answered red (0) except question 6, answered cyan (3)
const correct = Array.from({ length: 12 }, (_, i) => (i === 5 ? 3 : 0));
const reduce = gameReducer({ correct, stages: [0, 4, 8] });
const run = (actions: GameAction[], from: GameState = newGame(12)) => actions.reduce(reduce, from);

const play: GameAction = { type: 'play' };
const next: GameAction = { type: 'next' };
const retry: GameAction = { type: 'retry' };
const right = (q: number): GameAction => ({ type: 'answer', slot: correct[q] });
const wrong = (q: number): GameAction => ({ type: 'answer', slot: (correct[q] + 1) % 4 });

/** Answers questions `from` to `to` (inclusive) right, pressing Next after each. */
const rightRun = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => [right(from + i), next]).flat();

describe('gameReducer', () => {
  it('starts at the intro, and Play asks question 1', () => {
    expect(newGame(12)).toMatchObject({ screen: 'intro', question: 0, score: 0, underWay: false });
    expect(run([play])).toMatchObject({ screen: 'question', question: 0, underWay: true });
  });

  it('scores a right answer and moves on with Next', () => {
    const state = run([play, right(0)]);
    expect(state).toMatchObject({ screen: 'correct', score: 1, scored: true });
    expect(reduce(state, next)).toMatchObject({ screen: 'question', question: 1 });
  });

  it('shows a checkpoint after questions 4 and 8', () => {
    expect(run([play, ...rightRun(0, 3)])).toMatchObject({ screen: 'checkpoint', question: 4, score: 4 });
    expect(run([play, ...rightRun(0, 3), next, ...rightRun(4, 7)])).toMatchObject({ screen: 'checkpoint', question: 8, score: 8 });
  });

  it('sends a wrong answer back to the start of its stage', () => {
    expect(run([play, right(0), next, wrong(1)])).toMatchObject({ screen: 'flummoxed', question: 0, score: 1 });
    const later = run([play, ...rightRun(0, 3), next, right(4), next, wrong(5)]);
    expect(later).toMatchObject({ screen: 'flummoxed', question: 4, score: 5 });
    expect(reduce(later, retry)).toMatchObject({ screen: 'question', question: 4 });
  });

  it('gives nothing for a question asked again, right or wrong the first time', () => {
    // Q1 right, Q2 wrong, back to Q1: Q1 again scores nothing, Q2 right now scores nothing either
    const state = run([play, right(0), next, wrong(1), retry, right(0)]);
    expect(state).toMatchObject({ screen: 'correct', score: 1, scored: false });
    expect(run([next, right(1)], state)).toMatchObject({ score: 1, scored: false });
    expect(run([next, right(1), next, right(2)], state)).toMatchObject({ score: 2, scored: true });
  });

  it('finishes after question 12 with a perfect score', () => {
    const state = run([play, ...rightRun(0, 3), next, ...rightRun(4, 7), next, ...rightRun(8, 11)]);
    expect(state).toMatchObject({ screen: 'finished', score: 12, underWay: false });
  });

  it('offers to carry on after leaving the page, and Play goes back to the question', () => {
    const away = run([play, right(0), next, { type: 'open' }]);
    expect(away).toMatchObject({ screen: 'intro', question: 1, underWay: true });
    expect(reduce(away, play)).toMatchObject({ screen: 'question', question: 1, score: 1 });
  });

  it('starts a new game from the intro once one is finished', () => {
    const done = run([play, ...rightRun(0, 3), next, ...rightRun(4, 7), next, ...rightRun(8, 11), { type: 'open' }]);
    expect(reduce(done, play)).toMatchObject({ screen: 'question', question: 0, score: 0 });
  });

  it('goes from the end of a game to sharing and back', () => {
    const done = run([play, ...rightRun(0, 3), next, ...rightRun(4, 7), next, ...rightRun(8, 11)]);
    expect(reduce(done, { type: 'share' })).toMatchObject({ screen: 'share', score: 12 });
    expect(run([{ type: 'share' }, { type: 'back' }], done)).toMatchObject({ screen: 'finished' });
    expect(reduce(run([play]), { type: 'share' }).screen).toBe('question');
  });

  it('restarts from question 1 with no score', () => {
    expect(run([play, right(0), next, { type: 'restart' }])).toMatchObject({ screen: 'question', question: 0, score: 0, answered: newGame(12).answered });
  });

  it('ignores actions that do not fit the screen', () => {
    const question = run([play]);
    expect(reduce(question, next)).toBe(question);
    expect(reduce(question, retry)).toBe(question);
    const correctScreen = reduce(question, right(0));
    expect(reduce(correctScreen, right(0))).toBe(correctScreen);
  });
});

describe('stageOf', () => {
  it('finds the stage a question is in', () => {
    expect([0, 3, 4, 7, 8, 11].map((q) => stageOf([0, 4, 8], q))).toEqual([0, 0, 1, 1, 2, 2]);
  });
});

describe('restoreGame', () => {
  it('keeps a saved game that fits the quiz', () => {
    const saved = run([play, right(0), next]);
    expect(restoreGame(JSON.parse(JSON.stringify(saved)), 12)).toEqual(saved);
  });

  it('starts fresh from anything else', () => {
    expect(restoreGame(null, 12)).toEqual(newGame(12));
    expect(restoreGame({ ...run([play]), question: 12 }, 12)).toEqual(newGame(12));
    expect(restoreGame({ ...run([play]), answered: [true] }, 12)).toEqual(newGame(12));
    expect(restoreGame({ ...run([play]), screen: 'scores' }, 12)).toEqual(newGame(12));
  });
});
