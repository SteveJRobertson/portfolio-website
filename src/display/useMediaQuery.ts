import { useEffect, useState } from 'react';

/** Whether a media query matches now. False where `matchMedia` is missing (jsdom, very old browsers). */
export const matchesQuery = (query: string): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches;

export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
export const MORE_CONTRAST = '(prefers-contrast: more)';

/** Follows a media query, such as `prefers-reduced-motion`, as it changes. */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => matchesQuery(query));

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    list.addEventListener('change', update);
    update();
    return () => list.removeEventListener('change', update);
  }, [query]);

  return matches;
};

/** False while the tab is hidden, so timers that change the screen can wait. */
export const usePageVisible = (): boolean => {
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden);

  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  return visible;
};
