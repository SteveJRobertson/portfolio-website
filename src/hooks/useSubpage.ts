import { useCallback, useEffect, useState } from 'react';

/**
 * Which sub-page of the current page is showing. Resets to the first sub-page
 * when the page changes; ←/→ step through them. Phase 5 adds timed cycling.
 */
export const useSubpage = (page: number, count: number) => {
  const [state, setState] = useState({ page, index: 0 });
  const index = state.page === page ? Math.min(state.index, count - 1) : 0;

  const step = useCallback(
    (delta: number) => {
      if (count < 2) return;
      setState({ page, index: (index + delta + count) % count });
    },
    [page, index, count],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step]);

  return { index, count, step };
};
