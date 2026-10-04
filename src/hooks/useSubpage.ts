import { useCallback, useEffect, useState } from 'react';

/** How long each sub-page stays on screen before the next one (SPEC §5). */
export const SUBPAGE_INTERVAL_MS = 15_000;

export interface Subpage {
  index: number;
  count: number;
  /** HOLD is on: the current sub-page stays until it's released. */
  held: boolean;
  /** The last change came from the timer rather than the visitor (timed steps aren't announced). */
  auto: boolean;
  /** Steps forward or back, wrapping round. */
  step: (delta: number) => void;
  /** Jumps to a sub-page (used when focus moves into that part of the semantic mirror). */
  show: (index: number) => void;
  toggleHold: () => void;
}

interface Options {
  /** Stops the timer without setting HOLD: tab hidden, focus in the mirror, Text mode. */
  paused?: boolean;
  /** Each page opens held (set when the visitor prefers reduced motion). */
  startHeld?: boolean;
}

interface State {
  page: number;
  index: number;
  held: boolean;
  auto: boolean;
}

/**
 * Which sub-page of the current page is showing. Pages with sub-pages cycle on
 * a timer, as on Ceefax, until HOLD is pressed. A manual step restarts the
 * countdown. Changing page goes back to the first sub-page and releases HOLD.
 */
export const useSubpage = (page: number, count: number, { paused = false, startHeld = false }: Options = {}): Subpage => {
  const [stored, setState] = useState<State>(() => ({ page, index: 0, held: startHeld, auto: false }));
  // A different page starts over: first sub-page, HOLD released (or on, for reduced motion).
  const settle = useCallback(
    (s: State): State => (s.page === page ? { ...s, index: Math.min(s.index, count - 1) } : { page, index: 0, held: startHeld, auto: false }),
    [page, count, startHeld],
  );
  const { index, held, auto } = settle(stored);

  const step = useCallback(
    (delta: number) => {
      if (count < 2) return;
      setState((prev) => {
        const s = settle(prev);
        return { ...s, index: (s.index + delta + count) % count, auto: false };
      });
    },
    [count, settle],
  );

  const show = useCallback(
    (target: number) => {
      if (target >= 0 && target < count) setState((prev) => ({ ...settle(prev), index: target, auto: false }));
    },
    [count, settle],
  );

  const toggleHold = useCallback(() => {
    setState((prev) => {
      const s = settle(prev);
      return { ...s, held: !s.held, auto: false };
    });
  }, [settle]);

  useEffect(() => {
    if (count < 2 || held || paused) return;
    const timer = setTimeout(() => {
      setState((prev) => {
        const s = settle(prev);
        return { ...s, index: (s.index + 1) % count, auto: true };
      });
    }, SUBPAGE_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [page, index, count, held, paused, auto, settle]);

  return { index, count, held, auto, step, show, toggleHold };
};
