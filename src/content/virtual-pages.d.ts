declare module 'virtual:pages' {
  import type { CompiledPage } from '../types/teletext';

  export const pages: CompiledPage[];
}

declare module 'virtual:flummox' {
  import type { CompiledQuiz } from './flummox/types';

  export const quiz: CompiledQuiz;
  /** Specials to come, by name, in preview builds only, for `?preview=NAME`. */
  export const previews: Record<string, CompiledQuiz | undefined>;
  /** The dated special that's on for this build (src/content/specials), by name, or null. */
  export const special: string | null;
}

declare module 'virtual:flummox-cards' {
  import type { CompiledQuiz } from './flummox/types';

  /** The regular link-preview cards. */
  export const cards: CompiledQuiz['cards'];
  /** Each special's own cards, by name. */
  export const specialCards: Record<string, CompiledQuiz['cards']>;
}
