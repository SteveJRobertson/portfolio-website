import { describe, expect, it } from 'vitest';
import { GRID_MODES, MODE_QUERIES, bodyRowCount, resolveGridMode, type GridMode } from './gridModes';
import { blankRow, fitRow, rowFromData, rowLength, rowText, textRow, wrapRow, type GridRow } from './rows';
import { layoutBody, type PlacedLine } from './layout';
import { formatHeader } from './header';
import { fastextLabels, fastextSlotWidths } from './fastext';
import { SIDEBAR_ROWS } from './sidebar';
import { PAGE_202_ROWS, PAGE_404_ROWS } from './systemPages';
import { getPageData, getValidPageNumbers } from '../utils/pageRegistry';

const MODES = Object.values(GRID_MODES);

/** Marks every cell a placed line covers; throws on overlap or out-of-bounds. */
const coverage = (mode: GridMode, lines: PlacedLine[]) => {
  const cells = new Set<string>();
  for (const line of lines) {
    for (let r = line.row; r < line.row + line.height; r++) {
      for (let c = line.col; c < line.col + line.width; c++) {
        if (r < 2 || r > mode.rows - 1 || c < 1 || c > mode.cols) throw new Error(`${line.key} out of bounds at ${r},${c}`);
        const key = `${r},${c}`;
        if (cells.has(key)) throw new Error(`${line.key} overlaps at ${key}`);
        cells.add(key);
      }
    }
  }
  return cells;
};

const manyRows = (n: number): GridRow[] => Array.from({ length: n }, (_, i) => textRow(` ROW ${i}`));

describe('grid modes', () => {
  it('defines the three spec grids', () => {
    expect(MODES.map((m) => [m.name, m.cols, m.rows])).toEqual([
      ['widescreen', 56, 24],
      ['classic', 40, 24],
      ['portrait', 20, 36],
    ]);
  });

  it('splits widescreen into 38 + 1 + 17 columns', () => {
    const { mainCols, sidebarCols, cols } = GRID_MODES.widescreen;
    expect([mainCols, sidebarCols, mainCols + 1 + sidebarCols]).toEqual([38, 17, cols]);
  });

  it('picks the mode from aspect ratio queries alone', () => {
    const matching = (...queries: string[]) => (q: string) => queries.includes(q);
    expect(resolveGridMode(matching(MODE_QUERIES.widescreen))).toBe(GRID_MODES.widescreen);
    expect(resolveGridMode(matching(MODE_QUERIES.portrait))).toBe(GRID_MODES.portrait);
    expect(resolveGridMode(matching())).toBe(GRID_MODES.classic);
  });
});

describe('rows', () => {
  it('pads short rows and clips long rows to exactly the width', () => {
    expect(rowText(fitRow(textRow(' HI'), 10))).toBe(' HI       ');
    const clipped = fitRow({ segments: [{ text: 'ABCDEF', color: 'red' }, { text: 'GHIJ', color: 'cyan' }] }, 8);
    expect(rowText(clipped)).toBe('ABCDEFGH');
    expect(clipped.segments.map((s) => s.color)).toEqual(['red', 'cyan']);
  });

  it('counts mosaic characters as one cell each', () => {
    const mosaic = String.fromCodePoint(0x1fb00).repeat(3);
    expect(rowLength(fitRow(textRow(mosaic), 5))).toBe(5);
  });

  it('adapts page JSON rows, keeping the suffix white', () => {
    const row = rowFromData({ color: 'red', text: ' 101 ', suffix: 'ABOUT', doubleHeight: true });
    expect(row.segments).toEqual([
      { text: ' 101 ', color: 'red', bg: undefined },
      { text: 'ABOUT', color: 'white' },
    ]);
    expect(row.doubleHeight).toBe(true);
  });

  it('word-wraps to the portrait width, keeping colours and the indent', () => {
    const row: GridRow = { segments: [{ text: ' 101 ', color: 'red' }, { text: 'ABOUT ME & BACKGROUND', color: 'white' }] };
    const lines = wrapRow(row, 20);
    expect(lines.map(rowText)).toEqual([' 101 ABOUT ME &', ' BACKGROUND']);
    expect(lines[0].segments[1]).toMatchObject({ text: '101 ', color: 'red' });
    lines.forEach((line) => expect(rowLength(line)).toBeLessThanOrEqual(20));
  });

  it('clips rules instead of wrapping them', () => {
    expect(wrapRow(textRow('='.repeat(38)), 20)).toHaveLength(1);
  });

  it('hard-splits words longer than the line', () => {
    const word = 'ABCDEFGHIJ'.repeat(3);
    expect(wrapRow(textRow(' ' + word), 20).map(rowText)).toEqual([' ' + word.slice(0, 19), ' ' + word.slice(19)]);
  });
});

describe('layoutBody', () => {
  it.each(MODES)('keeps every line inside the $name body without overlaps', (mode) => {
    expect(() => coverage(mode, layoutBody(mode, manyRows(50), SIDEBAR_ROWS))).not.toThrow();
  });

  it.each(MODES)('fills at most rows - 2 body slots in $name', (mode) => {
    const main = layoutBody(mode, manyRows(50)).filter((l) => l.key.startsWith('main'));
    expect(main).toHaveLength(bodyRowCount(mode));
    main.forEach((line) => expect(rowLength(line.content)).toBe(mode.mainCols));
  });

  it('gives a double-height row two slots', () => {
    const lines = layoutBody(GRID_MODES.classic, [textRow('TITLE', 'cyan', { doubleHeight: true }), textRow('NEXT')]);
    expect(lines.map((l) => [l.row, l.height])).toEqual([
      [2, 2],
      [4, 1],
    ]);
  });

  it('drops a double-height row that would spill into the Fastext row', () => {
    const rows = [...manyRows(21), textRow('BIG', 'white', { doubleHeight: true })];
    const lines = layoutBody(GRID_MODES.classic, rows);
    expect(lines).toHaveLength(21);
    expect(lines.at(-1)?.row).toBe(22);
  });

  it('builds the widescreen sidebar from data with a separator on every body row', () => {
    const mode = GRID_MODES.widescreen;
    const lines = layoutBody(mode, [], SIDEBAR_ROWS);
    const sidebar = lines.filter((l) => l.key.startsWith('side'));
    const separators = lines.filter((l) => l.key.startsWith('sep'));
    expect(sidebar.map((l) => rowText(l.content).trimEnd())).toEqual(SIDEBAR_ROWS.map((r) => rowText(r).trimEnd()));
    expect(sidebar.every((l) => l.col === 40 && l.width === 17)).toBe(true);
    expect(separators).toHaveLength(bodyRowCount(mode));
    expect(separators.every((l) => l.col === 39)).toBe(true);
  });

  it('has no sidebar outside widescreen', () => {
    expect(layoutBody(GRID_MODES.classic, [], SIDEBAR_ROWS)).toEqual([]);
  });

  it.each(MODES)('fits every current page on the $name grid', (mode) => {
    const pages = [
      ...getValidPageNumbers().map((n) => getPageData(n)!.mainRows.map(rowFromData)),
      PAGE_202_ROWS,
      PAGE_404_ROWS,
    ];
    for (const rows of pages) {
      const placed = layoutBody(mode, rows).filter((l) => l.key.startsWith('main'));
      const needed = (mode.name === 'portrait' ? rows.flatMap((r) => wrapRow(r, mode.mainCols)) : rows).length;
      expect(placed).toHaveLength(needed);
    }
  });
});

describe('formatHeader', () => {
  const now = new Date(2026, 9, 4, 14, 3, 22);

  it.each(MODES)('is exactly $cols cells wide in $name', ({ cols }) => {
    expect(rowLength(formatHeader({ bufferText: 'P100', currentPage: 100, now, cols }))).toBe(cols);
  });

  it('formats each width', () => {
    const text = (cols: number) => rowText(formatHeader({ bufferText: 'P1--', currentPage: 100, now, cols }));
    expect(text(56)).toBe('P1-- STEVE-TEXT 100' + ' '.repeat(18) + 'SUN 04 OCT 14:03:22');
    expect(text(40)).toBe('P1-- STEVE-TEXT 100      04 OCT 14:03:22');
    expect(text(20)).toBe('P1-- STEVE     14:03');
  });
});

describe('fastext', () => {
  it.each(MODES)('splits $cols columns into four slots that fill the row', ({ cols }) => {
    const widths = fastextSlotWidths(cols);
    expect(widths).toHaveLength(4);
    expect(widths.reduce((a, b) => a + b, 0)).toBe(cols);
  });

  it('uses the longest label form that fits every slot', () => {
    const link = (label: string, page: number) => ({ label, page, path: `/${page}`, color: 'red' as const });
    const links = [link('About [101]', 101), link('Projects [200]', 200), link('Stack [300]', 300), link('Contact [400]', 400)];
    expect(fastextLabels(links, [14, 14, 14, 14])).toEqual([' About [101]  ', 'Projects [200]', ' Stack [300]  ', 'Contact [400] ']);
    expect(fastextLabels(links, [10, 10, 10, 10])).toEqual(['  About   ', ' Projects ', '  Stack   ', ' Contact  ']);
    expect(fastextLabels(links, [5, 5, 5, 5])).toEqual([' 101 ', ' 200 ', ' 300 ', ' 400 ']);
  });

  it('keeps blank rows blank', () => {
    expect(rowText(fitRow(blankRow(), 3))).toBe('   ');
  });
});
