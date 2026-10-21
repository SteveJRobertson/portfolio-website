import { quiz as compiled, previews, special as specialOn } from 'virtual:flummox';
import type { CompiledQuiz } from '../content/flummox/types';

/** A special to play before its dates, from `?preview=NAME`: preview builds only carry them. */
const previewName = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('preview');

/**
 * The quiz, laid out at build time from `src/content/flummox/quiz.json`, or
 * from the dated special that's on (src/content/specials).
 */
export const quiz: CompiledQuiz = (previewName && previews[previewName]) || compiled;

/** The dated special that's on for this build, by name, whose link-preview pictures are in public/share/NAME/. */
export const special: string | null = specialOn;
