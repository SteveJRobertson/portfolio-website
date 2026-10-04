import { blankRow, textRow, type GridRow } from './rows';

/** Row id that marks where page 202's canvas demo sits. */
export const CANVAS_ANCHOR = 'canvas';
export const CANVAS_ROWS = 6;

// Pages 202 and 404 stay in code until Phase 3 moves them into content.
export const PAGE_202_ROWS: GridRow[] = [
  textRow('======================================', 'yellow'),
  textRow(' P202 TELETEXT CANVAS SHADER ART', 'yellow'),
  textRow('======================================', 'yellow'),
  textRow(' Real-time 8-color mosaic posterizer:'),
  { ...blankRow(), id: CANVAS_ANCHOR },
  ...Array.from({ length: CANVAS_ROWS - 1 }, blankRow),
  textRow(' Dithers image pixels to SAA5050.', 'green'),
  textRow(" PRESS [200] OR 'R' TO RETURN LIST", 'yellow'),
];

export const PAGE_404_ROWS: GridRow[] = [
  textRow('======================================', 'red'),
  textRow(' P404 SIGNAL LOST / PAGE NOT FOUND', 'red', { doubleHeight: true }),
  textRow('======================================', 'red'),
  textRow(' The page number keyed is unassigned.'),
  blankRow(),
  textRow(" PRESS [100] OR 'R' TO RETURN HOME", 'yellow'),
];
