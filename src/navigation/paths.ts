import { NOT_FOUND_PAGE } from '../content/registry';

export const HOME_PAGE = 100;

/** Where the site is served from, with a trailing slash: `/` locally, `/portfolio-website/` on GitHub Pages (Vite's `base`). */
const BASE = import.meta.env.BASE_URL;

/**
 * The one place a page URL is built: the base for 100, `<base>NNN/` otherwise.
 * The trailing slash matches the pre-rendered `NNN/index.html` files, so GitHub
 * Pages serves them without a redirect.
 */
export const pageHref = (page: number, base = BASE): string => (page === HOME_PAGE ? base : `${base}${page}/`);

/**
 * The page a path asks for: the base is 100, `<base>NNN` is NNN (found or not,
 * with or without a slash), a Flummox! score page (`<base>152/score/N/`) is
 * 152, anything else is the not-found page.
 */
export const pageFromPath = (path: string, base = BASE): number => {
  const local = path.startsWith(base) ? path.slice(base.length) : path;
  const clean = local.replace(/^\/+|\/+$/g, '');
  if (!clean) return HOME_PAGE;
  if (/^152\/score\/\d{1,2}$/.test(clean)) return 152;
  return /^\d{3}$/.test(clean) ? Number(clean) : NOT_FOUND_PAGE;
};

/** True for a plain left click; a modified or middle click keeps the browser's own behaviour (new tab and so on). */
export const isPlainClick = (e: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }) =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
