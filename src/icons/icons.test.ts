import { describe, expect, it } from 'vitest';
import { ICONS, ICON_GRID, ICON_NAMES, ICON_PIXELS, iconRuns, mainColor } from './icons';

describe('icons', () => {
  it.each(ICON_NAMES)('%s is 12 × 12 pixels from the palette', (name) => {
    const { grid } = ICONS[name];
    expect(grid).toHaveLength(ICON_GRID);
    for (const row of grid) {
      expect(row).toHaveLength(ICON_GRID);
      for (const ch of row) if (ch !== '.') expect(ICON_PIXELS).toHaveProperty(ch);
    }
  });

  it('draws every pixel once, in runs', () => {
    const pixels = ICONS.facebook.grid.join('').replaceAll('.', '').length;
    expect(iconRuns('facebook').reduce((n, r) => n + r.width, 0)).toBe(pixels);
    expect(iconRuns('facebook')[0]).toEqual({ x: 4, y: 0, width: 4, color: 'blue' });
  });

  it('draws in one colour on request, cutting a second colour out', () => {
    expect(mainColor('facebook')).toBe('blue');
    const runs = iconRuns('facebook', 'yellow');
    expect(new Set(runs.map((r) => r.color))).toEqual(new Set(['yellow']));
    const blue = ICONS.facebook.grid.join('').replace(/[^b]/g, '').length;
    expect(runs.reduce((n, r) => n + r.width, 0)).toBe(blue);
  });
});
