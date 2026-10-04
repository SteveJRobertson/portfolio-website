import { bodyRowCount, type GridMode } from './gridModes';
import { fitRow, textRow, type GridRow } from './rows';

/** A row placed on the grid. `row` and `col` are 1-based grid lines. */
export interface PlacedLine {
  key: string;
  row: number;
  col: number;
  width: number;
  height: 1 | 2;
  content: GridRow;
}

const FIRST_BODY_ROW = 2;

const SEPARATOR = textRow('│', 'blue');

/**
 * Places body rows (and, in widescreen, the separator and quick index) into
 * the rows between the header and the Fastext bar. Rows arrive already
 * wrapped for the mode; any that don't fit are dropped, though the content
 * validator rejects such pages at build time.
 */
export const layoutBody = (mode: GridMode, body: GridRow[], sidebar: GridRow[] = []): PlacedLine[] => {
  const lastBodyRow = FIRST_BODY_ROW + bodyRowCount(mode) - 1;
  const placed: PlacedLine[] = [];

  let slot = FIRST_BODY_ROW;
  for (const [i, row] of body.entries()) {
    const height = row.doubleHeight ? 2 : 1;
    if (slot + height - 1 > lastBodyRow) break;
    placed.push({ key: `main-${i}`, row: slot, col: 1, width: mode.mainCols, height, content: fitRow(row, mode.mainCols) });
    slot += height;
  }

  if (mode.sidebarCols > 0) {
    const separatorCol = mode.mainCols + 1;
    const sidebarCol = separatorCol + 1;
    for (let r = FIRST_BODY_ROW; r <= lastBodyRow; r++) {
      placed.push({ key: `sep-${r}`, row: r, col: separatorCol, width: 1, height: 1, content: SEPARATOR });
    }
    sidebar.slice(0, bodyRowCount(mode)).forEach((row, i) => {
      placed.push({
        key: `side-${i}`,
        row: FIRST_BODY_ROW + i,
        col: sidebarCol,
        width: mode.sidebarCols,
        height: 1,
        content: fitRow({ ...row, doubleHeight: false }, mode.sidebarCols),
      });
    });
  }

  return placed;
};
