import { useCallback, useEffect, useState } from 'react';
import { pageFromPath, pageHref } from './paths';

export interface Navigation {
  /** The page number asked for. It may not exist; the app shows the not-found page then. */
  page: number;
  /** Counts user-initiated page changes (navigate, back, forward), so focus moves on change but not on first load. */
  changes: number;
  navigate: (page: number) => void;
}

interface State {
  page: number;
  changes: number;
}

const initialPage = () => (typeof window === 'undefined' ? 100 : pageFromPath(window.location.pathname));

/** The current page, kept in step with the URL through the History API (SPEC §5). */
export const useNavigation = (): Navigation => {
  const [state, setState] = useState<State>(() => ({ page: initialPage(), changes: 0 }));

  const navigate = useCallback((page: number) => {
    const href = pageHref(page);
    if (window.location.pathname !== href) window.history.pushState({ page }, '', href);
    setState((s) => ({ page, changes: s.changes + 1 }));
  }, []);

  useEffect(() => {
    const onPopState = () => setState((s) => ({ page: pageFromPath(window.location.pathname), changes: s.changes + 1 }));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return { page: state.page, changes: state.changes, navigate };
};
