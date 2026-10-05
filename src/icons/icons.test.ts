import { describe, expect, it } from 'vitest';
import { ICONS, ICON_HEIGHT, ICON_NAMES, ICON_PIXELS, ICON_WIDTH, iconImage, iconRows, mainColor } from './icons';
import { overfullCells } from '../content/mosaic';
import { rowLength } from '../display/rows';

describe('icons', () => {
  it.each(ICON_NAMES)('%s is 14 × 12 pixels from the palette', (name) => {
    const { grid } = ICONS[name];
    expect(grid).toHaveLength(ICON_HEIGHT);
    for (const row of grid) {
      expect(row).toHaveLength(ICON_WIDTH);
      for (const ch of row) expect(ICON_PIXELS).toHaveProperty(ch);
    }
  });

  it.each(ICON_NAMES)('%s shows at most two colours a cell, as a real set can', (name) => {
    expect(overfullCells(iconImage(name))).toEqual([]);
  });

  it.each(ICON_NAMES)('%s lays out as 4 rows of 7 cells', (name) => {
    const rows = iconRows(name);
    expect(rows).toHaveLength(4);
    for (const row of rows) expect(rowLength(row)).toBe(7);
  });

  it('draws in one colour on request, cutting a second colour out', () => {
    expect(mainColor('facebook')).toBe('blue');
    const rows = iconRows('facebook', 'yellow');
    const colours = new Set(rows.flatMap((r) => r.segments.flatMap((s) => [s.color, s.bg]).filter(Boolean)));
    expect([...colours]).toEqual(['yellow']);
  });
});
