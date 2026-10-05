import { renderToStaticMarkup } from 'react-dom/server';
import { SemanticPage } from './components/SemanticPage';
import { documentTitle, pageDescription } from './content/meta';
import { NAVIGABLE_PAGES, NOT_FOUND_PAGE, PAGES } from './content/registry';
import { pageHref } from './navigation/paths';

/**
 * Server entry for `scripts/prerender.ts` (SPEC §5): for each page, its head
 * tags and the semantic mirror as static HTML, laid out like Text mode. It goes
 * in `#root` so search engines and visitors without JavaScript get the content;
 * the app replaces it when it starts.
 */
export interface PrerenderedPage {
  page: number;
  /** Where the file goes in `dist`, relative to it. */
  file: string;
  /** The page's path under the site's base, for the canonical link. */
  href: string;
  title: string;
  description: string;
  body: string;
}

const noop = () => {};
const PAGE_LIST = PAGES.filter((p) => NAVIGABLE_PAGES.includes(p.page));

export const prerender = (): PrerenderedPage[] =>
  PAGES.map((page) => ({
    page: page.page,
    file: page.page === NOT_FOUND_PAGE ? '404.html' : page.page === 100 ? 'index.html' : `${page.page}/index.html`,
    href: pageHref(page.page),
    title: documentTitle(page.page, page.title),
    description: pageDescription(page),
    body: renderToStaticMarkup(
      <div className="text-mode prerender">
        <header className="text-mode__bar">
          <span>
            STEEVEFAX <span className="c-cyan">P{page.page}</span>
          </span>
        </header>
        <SemanticPage page={page} heading={page.title} headingRef={null} pages={PAGE_LIST} onNavigate={noop} visible />
      </div>,
    ),
  }));
