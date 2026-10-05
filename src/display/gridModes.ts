/**
 * The single source of truth for screen modes (SPEC §3, DEC-004).
 * The mode is chosen by aspect ratio only; CSS keys off `data-mode` and never
 * repeats these queries.
 */
export type GridModeName = 'widescreen' | 'classic' | 'portrait';

export interface GridMode {
  name: GridModeName;
  cols: number;
  rows: number;
  /** Width of the main content pane. */
  mainCols: number;
  /** Quick-index sidebar width (widescreen only; 0 elsewhere). */
  sidebarCols: number;
}

export const GRID_MODES: Record<GridModeName, GridMode> = {
  // 38-column main pane + 1 blank column + 1-column separator + 16-column quick index.
  widescreen: { name: 'widescreen', cols: 56, rows: 24, mainCols: 38, sidebarCols: 16 },
  classic: { name: 'classic', cols: 40, rows: 24, mainCols: 40, sidebarCols: 0 },
  portrait: { name: 'portrait', cols: 32, rows: 34, mainCols: 32, sidebarCols: 0 },
};

export const MODE_QUERIES = {
  widescreen: '(min-aspect-ratio: 16/10)',
  portrait: '(max-aspect-ratio: 1/1)',
} as const;

/** Widescreen wins at exactly 16/10, portrait at exactly 1/1; everything between is classic. */
export const resolveGridMode = (matches: (query: string) => boolean): GridMode => {
  if (matches(MODE_QUERIES.widescreen)) return GRID_MODES.widescreen;
  if (matches(MODE_QUERIES.portrait)) return GRID_MODES.portrait;
  return GRID_MODES.classic;
};

/** Header is row 1 and Fastext is the last row; everything between is body. */
export const bodyRowCount = (mode: GridMode): number => mode.rows - 2;
