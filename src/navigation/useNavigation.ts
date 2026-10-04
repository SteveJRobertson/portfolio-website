import { useCallback, useEffect, useState } from 'react';
import { NOT_FOUND_PAGE, isValidPage } from '../content/registry';
import { pageFromPath, pageHref } from './paths';

export interface Navigation {
  /** The page showing: a registry page, or 404 for anything else. */
  page: number;
  /** Counts user-initiated page changes (navigate, back, forward), so focus moves on change but not on first load. */
  changes: number;
  navigate: (page: number) => void;
}

interface State {
  page: number;
  changes: number;
}

/** Unknown page numbers redirect to the not-found page, 404. */
export const resolvePage = (page: number): number => (isValidPage(page) ? page : NOT_FOUND_PAGE);

const pageFromLocation = () => resolvePage(pageFromPath(window.location.pathname));

/** Puts the URL right when it names a page that doesn't exist, without adding a history entry. */
const replaceUnknownPath = (page: number) => {
  if (window.location.pathname !== pageHref(page)) window.history.replaceState({ page }, '', pageHref(page));
};

/** The current page, kept in step with the URL through the History API (SPEC §5). */
export const useNavigation = (): Navigation => {
  const [state, setState] = useState<State>(() => ({
    page: typeof window === 'undefined' ? 100 : pageFromLocation(),
    changes: 0,
  }));

  const navigate = useCallback((requested: number) => {
    const page = resolvePage(requested);
    const href = pageHref(page);
    if (window.location.pathname !== href) window.history.pushState({ page }, '', href);
    setState((s) => ({ page, changes: s.changes + 1 }));
  }, []);

  useEffect(() => {
    replaceUnknownPath(pageFromLocation());
    const onPopState = () => {
      const page = pageFromLocation();
      replaceUnknownPath(page);
      setState((s) => ({ page, changes: s.changes + 1 }));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return { page: state.page, changes: state.changes, navigate };
};
