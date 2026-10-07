import { THIN_LINE, type GridRow, type GridSegment, type TeletextColor } from '../types/teletext';

export type { GridRow, GridSegment };

// Mosaic sextants are astral code points, so count code points rather than UTF-16 units.
const chars = (text: string): string[] => Array.from(text);

export const rowLength = (row: GridRow): number =>
  row.segments.reduce((total, segment) => total + chars(segment.text).length, 0);

export const rowText = (row: GridRow): string => row.segments.map((s) => s.text).join('');

export const textRow = (text: string, color?: TeletextColor, extra: Partial<GridRow> = {}): GridRow => ({
  segments: [{ text, color }],
  ...extra,
});

export const blankRow = (): GridRow => ({ segments: [] });

/**
 * Clips or pads a row to exactly `width` cells. A `{rule}` row fills the width
 * after any leading text; a banner row extends its band.
 */
export const fitRow = (row: GridRow, width: number): GridRow => {
  if (row.fill) {
    const lead = chars(rowText(row)).slice(0, width).join('');
    const color = row.segments[0]?.color;
    const rule: GridSegment = { text: row.fill.repeat(width - chars(lead).length), color, ...(row.fill === THIN_LINE ? { line: true } : {}) };
    return { ...row, segments: lead ? [{ text: lead }, rule] : [rule] };
  }
  const segments: GridSegment[] = [];
  let used = 0;
  for (const segment of row.segments) {
    if (used >= width) break;
    const text = chars(segment.text).slice(0, width - used).join('');
    if (text.length === 0) continue;
    segments.push({ ...segment, text });
    used += chars(text).length;
  }
  if (used < width) {
    segments.push(row.fillBg ? { text: ' '.repeat(width - used), bg: row.fillBg, mosaic: true } : { text: ' '.repeat(width - used) });
  }
  return { ...row, segments };
};
