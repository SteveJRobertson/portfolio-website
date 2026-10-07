declare module 'virtual:pages' {
  import type { CompiledPage } from '../types/teletext';

  export const pages: CompiledPage[];
}

declare module 'virtual:flummox' {
  import type { CompiledQuiz } from './flummox/types';

  export const quiz: CompiledQuiz;
}
