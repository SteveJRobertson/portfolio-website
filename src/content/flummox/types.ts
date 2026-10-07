import type { CompiledScreen } from '../compile.ts';
import type { GridRow } from '../../types/teletext.ts';

/**
 * Flummox!, the quiz on page 152 (docs/flummox/SPEC.md). `quiz.json` is
 * checked and laid out at build time into these screens, served as
 * `virtual:flummox`; the app only picks a screen and fills in its slots.
 */

export interface QuizQuestionSource {
  question: string;
  /** Red, green, yellow, cyan. */
  answers: [string, string, string, string];
  /** The right answer's index, 0 (red) to 3 (cyan). */
  correct: number;
  /** Felix's line after a right answer. */
  quip?: string;
}

export interface QuizVerdictSource {
  /** The lowest score that gets this verdict. */
  min: number;
  text: string;
}

export interface QuizSource {
  /** Names this set of questions; a new edition starts a new best score. */
  edition: string;
  /** The questions after which a wrong answer no longer sends you back further, e.g. [3, 6, 9]. */
  checkpoints: number[];
  /** The shared message; `{score}` becomes the final score. */
  share: string;
  verdicts: QuizVerdictSource[];
  questions: QuizQuestionSource[];
}

export interface CompiledQuestion {
  question: string;
  answers: [string, string, string, string];
  correct: number;
  /** The question with its four answers. Slots: score. */
  screen: CompiledScreen;
  /** After a right answer. Slots: point, score. */
  correctScreen: CompiledScreen;
}

export interface CompiledQuiz {
  edition: string;
  /** Index of the first question of each stage: [0, 3, 6, 9] for checkpoints after 3, 6 and 9. */
  stages: number[];
  /** The shared message, with `{score}` where the score goes. */
  message: string;
  questions: CompiledQuestion[];
  /** Before a first game, with no best score yet. */
  intro: CompiledScreen;
  /** Before a game, once there is a best score. Slots: best. */
  introBest: CompiledScreen;
  /** A game under way. Slots: best, resume. */
  introResume: CompiledScreen;
  /** After a wrong answer, one per stage (back to that stage's first question). Slots: score. */
  flummoxed: CompiledScreen[];
  /** Reaching each stage after the first. Slots: score. */
  checkpoint: CompiledScreen[];
  /** The end of a game, one per verdict, highest `min` first. Slots: score, newbest. */
  finished: { min: number; text: string; screen: CompiledScreen }[];
  /** Where to share the score, one per score from 0 to 12, with the message in it. Its lines are answers 0 to 6, one per network. */
  share: CompiledScreen[];
  /** Link-preview pictures (SPEC §6), 56 × 23 rows under a header: page 152's own, and one per score from 0 to 12. */
  cards: { intro: GridRow[]; scores: GridRow[][] };
}
