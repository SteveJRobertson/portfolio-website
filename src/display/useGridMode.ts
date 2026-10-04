import { useEffect, useState } from 'react';
import { GRID_MODES, MODE_QUERIES, resolveGridMode, type GridMode } from './gridModes';

const currentMode = (): GridMode => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return GRID_MODES.classic;
  }
  return resolveGridMode((query) => window.matchMedia(query).matches);
};

export const useGridMode = (): GridMode => {
  const [mode, setMode] = useState<GridMode>(currentMode);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const lists = Object.values(MODE_QUERIES).map((query) => window.matchMedia(query));
    const update = () => setMode(currentMode());
    lists.forEach((list) => list.addEventListener('change', update));
    update();
    return () => lists.forEach((list) => list.removeEventListener('change', update));
  }, []);

  return mode;
};
