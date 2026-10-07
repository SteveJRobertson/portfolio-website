import type { CompiledScreen } from '../content/compile';
import type { CompiledQuiz } from '../content/flummox/types';
import type { FastextAction } from '../display/fastext';
import type { FastextLink } from '../types/teletext';
import { stageOf, type GameAction, type GameState } from './game';
import { twoDigits, type SlotValues } from './slots';

/** A Fastext slot on page 152: a page link, or something the game does. */
export type FlummoxSlot = FastextLink | FastextAction;

/** What the game asks of the page beyond its own state. */
export interface FlummoxEffects {
  /** Shares the score: the phone's share sheet where there is one, otherwise the Share screen. */
  share: () => void;
  /** Copies the message and link. */
  copy: () => void;
}

export interface FlummoxView {
  screen: CompiledScreen;
  slots: SlotValues;
  fastext: [FlummoxSlot, FlummoxSlot, FlummoxSlot, FlummoxSlot];
}

const KEY_NAMES = ['Red', 'Green', 'Yellow', 'Cyan'];
const HOME: FastextLink = { page: 100, label: 'Home' };
const ABOUT: FastextLink = { page: 101, label: 'About' };
const CONTACT: FastextLink = { page: 400, label: 'Contact' };

/** The rules as the game needs them, from the compiled quiz. */
export const quizRules = (quiz: CompiledQuiz) => ({ correct: quiz.questions.map((q) => q.correct), stages: quiz.stages });

/** The compiled screen for a state of the game. */
export const screenFor = (quiz: CompiledQuiz, game: GameState): CompiledScreen => {
  const stage = stageOf(quiz.stages, game.question);
  switch (game.screen) {
    case 'intro':
      return game.underWay ? quiz.introResume : quiz.intro;
    case 'question':
      return quiz.questions[game.question].screen;
    case 'correct':
      return quiz.questions[game.question].correctScreen;
    case 'flummoxed':
      return quiz.flummoxed[stage];
    case 'checkpoint':
      return quiz.checkpoint[stage - 1];
    case 'finished':
      return quiz.finished.find((f) => game.score >= f.min)!.screen;
    case 'share':
      return quiz.share[game.score];
  }
};

/**
 * What page 152 shows for a state of the game: the screen, the values for
 * its slots, and the Fastext row (SPEC §8). On a question the four keys
 * answer; on a result any key carries on, as on Bamboozle!.
 */
export const flummoxView = (
  quiz: CompiledQuiz,
  game: GameState,
  best: number | undefined,
  newBest: boolean,
  dispatch: (action: GameAction) => void,
  effects: FlummoxEffects,
): FlummoxView => {
  const action = (slot: number, label: string, run: GameAction): FastextAction => ({
    label,
    name: `${KEY_NAMES[slot]}: ${label}`,
    onPress: () => dispatch(run),
  });
  const keys = (name: (slot: number) => string, run: (slot: number) => GameAction) =>
    [0, 1, 2, 3].map((slot): FastextAction => ({ name: `${KEY_NAMES[slot]}: ${name(slot)}`, onPress: () => dispatch(run(slot)) })) as FlummoxView['fastext'];

  const carryOn = (run: GameAction) => keys(() => 'Continue', () => run);

  let fastext: FlummoxView['fastext'];
  switch (game.screen) {
    case 'intro':
      fastext = game.underWay
        ? [action(0, 'Resume', { type: 'play' }), action(1, 'Restart', { type: 'restart' }), HOME, CONTACT]
        : [action(0, 'Play', { type: 'play' }), HOME, ABOUT, CONTACT];
      break;
    case 'question':
      fastext = keys((slot) => quiz.questions[game.question].answers[slot], (slot) => ({ type: 'answer', slot }));
      break;
    case 'correct':
    case 'checkpoint':
      fastext = carryOn({ type: 'next' });
      break;
    case 'flummoxed':
      fastext = carryOn({ type: 'retry' });
      break;
    case 'finished':
      fastext = [action(0, 'Again', { type: 'restart' }), HOME, { label: 'Share', name: 'Yellow: Share your score', onPress: effects.share }, CONTACT];
      break;
    case 'share':
      fastext = [HOME, action(1, 'Back', { type: 'back' }), { label: 'Copy', name: 'Yellow: Copy the message and link', onPress: effects.copy }, CONTACT];
      break;
  }

  return {
    screen: screenFor(quiz, game),
    slots: {
      score: twoDigits(game.score),
      best: best === undefined ? '--' : twoDigits(best),
      resume: twoDigits(game.question + 1),
      point: game.scored ? '+1 POINT' : '',
      newbest: newBest ? 'NEW BEST!' : '',
    },
    fastext,
  };
};
