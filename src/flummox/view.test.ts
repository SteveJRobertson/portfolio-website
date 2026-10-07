import { describe, expect, it, vi } from 'vitest';
import { compileQuizFile } from '../../scripts/lib/pageFiles';
import { gameReducer, newGame, type GameAction } from './game';
import { flummoxView, quizRules, resultAnnouncement } from './view';

const { quiz } = compileQuizFile();
const reduce = gameReducer(quizRules(quiz!));
const play = (actions: GameAction[]) => actions.reduce(reduce, newGame(12));
const effects = { share: vi.fn(), copy: vi.fn() };
const right = (q: number): GameAction => ({ type: 'answer', slot: quiz!.questions[q].correct });

describe('flummoxView', () => {
  it('offers Play on the intro, keeping Home, About and Contact', () => {
    const view = flummoxView(quiz!, newGame(12), undefined, false, vi.fn(), effects);
    expect(view.screen).toBe(quiz!.intro);
    expect(view.fastext.map((s) => ('page' in s ? s.page : s.label))).toEqual(['Play', 100, 101, 400]);
    expect(view.slots.best).toBe('--');
  });

  it('offers Resume and Restart once a game is under way', () => {
    const view = flummoxView(quiz!, play([{ type: 'play' }, right(0), { type: 'next' }, { type: 'open' }]), 7, false, vi.fn(), effects);
    expect(view.screen).toBe(quiz!.introResume);
    expect(view.fastext.map((s) => ('page' in s ? s.page : s.label))).toEqual(['Resume', 'Restart', 100, 400]);
    expect(view.slots).toMatchObject({ best: '07', resume: '02', score: '01' });
  });

  it('makes the four keys answer a question, named for their answers', () => {
    const dispatch = vi.fn();
    const view = flummoxView(quiz!, play([{ type: 'play' }]), undefined, false, dispatch, effects);
    const keys = view.fastext.map((s) => ('page' in s ? undefined : s));
    expect(keys.map((k) => k?.name)).toEqual(quiz!.questions[0].answers.map((a, i) => `${['Red', 'Green', 'Yellow', 'Cyan'][i]}: ${a}`));
    keys[2]!.onPress();
    expect(dispatch).toHaveBeenCalledWith({ type: 'answer', slot: 2 });
  });

  it('carries on with any key after a result, as on Bamboozle!', () => {
    const dispatch = vi.fn();
    const view = flummoxView(quiz!, play([{ type: 'play' }, right(0)]), undefined, false, dispatch, effects);
    expect(view.screen).toBe(quiz!.questions[0].correctScreen);
    expect(view.slots.point).toBe('+1 POINT');
    view.fastext.forEach((s) => !('page' in s) && s.onPress());
    expect(dispatch.mock.calls).toEqual(Array.from({ length: 4 }, () => [{ type: 'next' }]));
  });

  it('shows the flummoxed screen for the stage you go back to', () => {
    const wrong: GameAction = { type: 'answer', slot: (quiz!.questions[0].correct + 1) % 4 };
    expect(flummoxView(quiz!, play([{ type: 'play' }, wrong]), undefined, false, vi.fn(), effects).screen).toBe(quiz!.flummoxed[0]);
  });
});

describe('resultAnnouncement', () => {
  it('says the result in words, as the live region reads it', () => {
    expect(resultAnnouncement(play([{ type: 'play' }, right(0)]), 12)).toBe('Correct! Score 1.');
    const wrong: GameAction = { type: 'answer', slot: (quiz!.questions[1].correct + 1) % 4 };
    expect(resultAnnouncement(play([{ type: 'play' }, right(0), { type: 'next' }, wrong]), 12)).toBe('Flummoxed! Back to question 1. Score 1.');
    expect(resultAnnouncement(play([{ type: 'play' }]), 12)).toBeUndefined();
  });
});
