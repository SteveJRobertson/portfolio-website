import { pages } from 'virtual:pages';
import type { CompiledPage } from '../types/teletext';

/**
 * The one page registry (SPEC §6). The router, keypad, quick index and
 * validator all read the same compiled pages.
 */
export const PAGES: readonly CompiledPage[] = pages;

const byNumber = new Map(PAGES.map((p) => [p.page, p]));

export const NOT_FOUND_PAGE = 404;

export const getPage = (page: number): CompiledPage | undefined => byNumber.get(page);

/** Pages you can navigate to (the not-found page only appears for unknown numbers). */
export const isValidPage = (page: number): boolean => page !== NOT_FOUND_PAGE && byNumber.has(page);

export const NAVIGABLE_PAGES: readonly number[] = PAGES.map((p) => p.page).filter(isValidPage);

export const QUICK_INDEX: readonly CompiledPage[] = PAGES.filter((p) => p.index);
