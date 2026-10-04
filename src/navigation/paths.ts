import { NOT_FOUND_PAGE } from '../content/registry';

export const HOME_PAGE = 100;

/** The one place a page URL is built (`/` for 100, `/NNN` otherwise), so Phase 6 can add a base path here. */
export const pageHref = (page: number): string => (page === HOME_PAGE ? '/' : `/${page}`);

/** The page a path asks for: `/` is 100, `/NNN` is NNN (found or not), anything else is the not-found page. */
export const pageFromPath = (path: string): number => {
  const clean = path.replace(/^\/+|\/+$/g, '');
  if (!clean) return HOME_PAGE;
  return /^\d{3}$/.test(clean) ? Number(clean) : NOT_FOUND_PAGE;
};

/** True for a plain left click; a modified or middle click keeps the browser's own behaviour (new tab and so on). */
export const isPlainClick = (e: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }) =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
