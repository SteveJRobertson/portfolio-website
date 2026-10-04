import { useCallback, useState } from 'react';

export interface Subpage {
  index: number;
  count: number;
  /** Steps forward or back, wrapping round. */
  step: (delta: number) => void;
  /** Jumps to a sub-page (used when focus moves into that part of the semantic mirror). */
  show: (index: number) => void;
}

/**
 * Which sub-page of the current page is showing. Resets to the first sub-page
 * when the page changes. Phase 5 adds timed cycling.
 */
export const useSubpage = (page: number, count: number): Subpage => {
  const [state, setState] = useState({ page, index: 0 });
  const index = state.page === page ? Math.min(state.index, count - 1) : 0;

  const step = useCallback(
    (delta: number) => {
      if (count < 2) return;
      setState({ page, index: (index + delta + count) % count });
    },
    [page, index, count],
  );

  const show = useCallback(
    (target: number) => {
      if (target >= 0 && target < count) setState({ page, index: target });
    },
    [page, count],
  );

  return { index, count, step, show };
};
