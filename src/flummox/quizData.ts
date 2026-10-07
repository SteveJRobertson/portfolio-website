import { quiz as compiled } from 'virtual:flummox';
import type { CompiledQuiz } from '../content/flummox/types';

/** The quiz, laid out at build time from `src/content/flummox/quiz.json`. */
export const quiz: CompiledQuiz = compiled;
