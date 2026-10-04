import { describe, expect, it } from 'vitest';
import { GRID_MODES, MODE_QUERIES, bodyRowCount, resolveGridMode, type GridMode } from './gridModes';
import { blankRow, fitRow, rowLength, rowText, textRow, type GridRow } from './rows';
import { layoutBody, type PlacedLine } from './layout';
import { formatHeader } from './header';
import { fastextLabels, fastextSlotWidths } from './fastext';
import { sidebarRows } from './sidebar';
import { PAGES, QUICK_INDEX } from '../content/registry';

const SIDEBAR_ROWS = sidebarRows(QUICK_INDEX);

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

  it('fills a rule row to whatever width it is fitted to', () => {
    const rule: GridRow = { segments: [{ text: '', color: 'blue' }], fill: '=' };
    expect(fitRow(rule, 40).segments).toEqual([{ text: '='.repeat(40), color: 'blue' }]);
    expect(rowLength(fitRow(rule, 20))).toBe(20);
    const lip: GridRow = { segments: [{ text: ' ', color: 'red' }], fill: '-' };
    expect(fitRow(lip, 5).segments).toEqual([{ text: ' ' }, { text: '----', color: 'red' }]);
  });

  it('extends a banner band to the full width', () => {
    const band: GridRow = { segments: [{ text: ' ' }, { text: 'AB', bg: 'blue', mosaic: true }], fillBg: 'blue' };
    expect(fitRow(band, 5).segments.at(-1)).toEqual({ text: '  ', bg: 'blue', mosaic: true });
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

  it.each(MODES)('fits every page and sub-page on the $name grid', (mode) => {
    for (const page of PAGES) {
      for (const rows of mode.name === 'portrait' ? page.narrow : page.wide) {
        const placed = layoutBody(mode, rows).filter((l) => l.key.startsWith('main'));
        expect(placed).toHaveLength(rows.length);
      }
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

  it.each(MODES)('fits a sub-page counter in $name', ({ cols }) => {
    const row = formatHeader({ bufferText: 'P110', currentPage: 110, now, cols, subpage: { index: 1, count: 6 } });
    expect(rowLength(row)).toBe(cols);
    expect(rowText(row)).toContain('2/6');
  });

  it('shows the counter after the page number, or before the name in portrait', () => {
    const text = (cols: number) =>
      rowText(formatHeader({ bufferText: 'P110', currentPage: 110, now, cols, subpage: { index: 0, count: 6 } }));
    expect(text(40)).toBe('P110 STEVE-TEXT 110 1/6  04 OCT 14:03:22');
    expect(text(20)).toBe('P110 1/6 STEVE 14:03');
  });

  it.each(MODES)('fits HOLD after the counter in $name', ({ cols }) => {
    const row = formatHeader({ bufferText: 'P110', currentPage: 110, now, cols, subpage: { index: 1, count: 6, held: true } });
    expect(rowLength(row)).toBe(cols);
    expect(rowText(row)).toContain('2/6 HOLD');
  });

  it('makes room for HOLD by dropping the date at 40 columns and the name at 20', () => {
    const text = (cols: number) =>
      rowText(formatHeader({ bufferText: 'P110', currentPage: 110, now, cols, subpage: { index: 0, count: 6, held: true } }));
    expect(text(56)).toBe('P110 STEVE-TEXT 110 1/6 HOLD' + ' '.repeat(9) + 'SUN 04 OCT 14:03:22');
    expect(text(40)).toBe('P110 STEVE-TEXT 110 1/6 HOLD    14:03:22');
    expect(text(20)).toBe('P110 1/6 HOLD  14:03');
  });

  it('hides the counter on single pages', () => {
    const row = formatHeader({ bufferText: 'P100', currentPage: 100, now, cols: 40, subpage: { index: 0, count: 1 } });
    expect(rowText(row)).not.toContain('1/1');
  });
});

describe('fastext', () => {
  it.each(MODES)('splits $cols columns into four slots that fill the row', ({ cols }) => {
    const widths = fastextSlotWidths(cols);
    expect(widths).toHaveLength(4);
    expect(widths.reduce((a, b) => a + b, 0)).toBe(cols);
  });

  it('shows labels when they all fit, otherwise page numbers', () => {
    const links = [
      { label: 'ABOUT', page: 101 },
      { label: 'CAREER', page: 110 },
      { label: 'SKILLS', page: 300 },
      { label: 'CONTACT', page: 400 },
    ];
    expect(fastextLabels(links, [10, 10, 10, 10])).toEqual(['  ABOUT   ', '  CAREER  ', '  SKILLS  ', ' CONTACT  ']);
    expect(fastextLabels(links, [5, 5, 5, 5])).toEqual([' 101 ', ' 110 ', ' 300 ', ' 400 ']);
  });

  it('falls back to page numbers when a label would touch its neighbour', () => {
    const links = [
      { label: 'HOME', page: 100 },
      { label: 'EXPERIENCE', page: 110 },
      { label: 'SKILLS', page: 300 },
      { label: 'CONTACT', page: 400 },
    ];
    expect(fastextLabels(links, [10, 10, 10, 10])).toEqual(['   100    ', '   110    ', '   300    ', '   400    ']);
  });

  it.each(MODES)('never runs labels together at $cols columns', ({ cols }) => {
    const widths = fastextSlotWidths(cols);
    for (const page of PAGES) {
      const row = fastextLabels(page.fastext, widths);
      row.forEach((slot) => expect(slot.endsWith(' ')).toBe(true));
    }
  });

  it('keeps every real Fastext label short enough to show in a classic slot', () => {
    for (const page of PAGES) page.fastext.forEach((link) => expect(link.label.length).toBeLessThan(10));
  });

  it('keeps blank rows blank', () => {
    expect(rowText(fitRow(blankRow(), 3))).toBe('   ');
  });
});
