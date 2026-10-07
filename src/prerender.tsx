import { renderToStaticMarkup } from 'react-dom/server';
import { SemanticPage } from './components/SemanticPage';
import { documentTitle, pageDescription } from './content/meta';
import { NAVIGABLE_PAGES, NOT_FOUND_PAGE, PAGES } from './content/registry';
import { pageHref } from './navigation/paths';
import { quiz } from './flummox/quizData';
import { scorePath } from './flummox/share';

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
  /** The page's canonical path, when it isn't `href`: a score page points at page 152. */
  canonical?: string;
  /** Kept out of search results and the sitemap. */
  noindex?: boolean;
  /** The link-preview picture under the site's base, and its alt text, when it isn't the site's own. */
  image?: { path: string; alt: string };
}

const noop = () => {};
const PAGE_LIST = PAGES.filter((p) => NAVIGABLE_PAGES.includes(p.page));

const pages = (): PrerenderedPage[] =>
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

const QUIZ_PAGE = 152;

/**
 * A page for each Flummox! score (docs/flummox/SPEC.md §6, Sharing): a shared
 * link's preview shows the score, and the app takes a visitor on to page 152.
 */
const scorePages = (all: PrerenderedPage[]): PrerenderedPage[] => {
  const quizPage = all.find((p) => p.page === QUIZ_PAGE)!;
  const total = quiz.questions.length;
  return Array.from({ length: total + 1 }, (_, score) => ({
    ...quizPage,
    file: `${QUIZ_PAGE}/${scorePath(score)}index.html`,
    href: `${pageHref(QUIZ_PAGE)}${scorePath(score)}`,
    title: `I scored ${score}/${total} on Flummox! | Steve Robertson`,
    description: `${quiz.finished.find((f) => score >= f.min)!.text} Can you flummox Felix?`,
    canonical: quizPage.href,
    noindex: true,
    image: {
      path: `share/flummox-${score}.png`,
      alt: `A Teletext screen: Flummox! score ${score} out of ${total}, with Felix Flummox ${score >= 9 ? 'looking flummoxed' : 'giving a thumbs-up'}.`,
    },
  }));
};

/** Page 152's own link preview: the Flummox! card. */
const QUIZ_IMAGE = {
  path: 'share/flummox.png',
  alt: 'A Teletext screen: Flummox!, with Felix Flummox giving a thumbs-up and asking "Can you flummox Felix?"',
};

export const prerender = (): PrerenderedPage[] => {
  const all = pages().map((p) => (p.page === QUIZ_PAGE && p.file !== '404.html' ? { ...p, image: QUIZ_IMAGE } : p));
  return [...all, ...scorePages(all)];
};
