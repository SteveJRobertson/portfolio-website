import type { TeletextColor, TeletextRowData } from '../types/teletext';

export interface GridSegment {
  text: string;
  color?: TeletextColor;
  bg?: TeletextColor;
}

export interface GridRow {
  segments: GridSegment[];
  /** Takes two row slots, glyphs stretched from the top row (as on real Teletext). */
  doubleHeight?: boolean;
  /** Lets callers find where a row was placed (e.g. to anchor a graphic). */
  id?: string;
}

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

/** Adapter for the current page JSON; replaced by the Phase 3 schema. */
export const rowFromData = (data: TeletextRowData): GridRow => {
  const segments: GridSegment[] = [{ text: data.text, color: data.color ?? 'white', bg: data.bg }];
  if (data.suffix) segments.push({ text: data.suffix, color: 'white' });
  return { segments, doubleHeight: data.doubleHeight };
};

/** Clips or pads a row to exactly `width` cells. */
export const fitRow = (row: GridRow, width: number): GridRow => {
  const segments: GridSegment[] = [];
  let used = 0;
  for (const segment of row.segments) {
    if (used >= width) break;
    const text = chars(segment.text).slice(0, width - used).join('');
    if (text.length === 0) continue;
    segments.push({ ...segment, text });
    used += chars(text).length;
  }
  if (used < width) segments.push({ text: ' '.repeat(width - used) });
  return { ...row, segments };
};

interface StyledChar {
  ch: string;
  color?: TeletextColor;
  bg?: TeletextColor;
}

const toStyledChars = (row: GridRow): StyledChar[] =>
  row.segments.flatMap((s) => chars(s.text).map((ch) => ({ ch, color: s.color, bg: s.bg })));

const toSegments = (styled: StyledChar[]): GridSegment[] => {
  const segments: GridSegment[] = [];
  for (const { ch, color, bg } of styled) {
    const last = segments[segments.length - 1];
    if (last && last.color === color && last.bg === bg) last.text += ch;
    else segments.push({ text: ch, color, bg });
  }
  return segments;
};

const isRule = (text: string): boolean => {
  const trimmed = text.trim();
  return trimmed.length > 1 && new Set(chars(trimmed)).size === 1;
};

/**
 * Stop-gap word wrap for portrait mode, until the Phase 3 build-time wrapper.
 * Keeps colours per character, keeps a one-cell indent, and clips rules
 * ("=====") instead of wrapping them.
 */
export const wrapRow = (row: GridRow, width: number): GridRow[] => {
  const text = rowText(row);
  if (chars(text.trimEnd()).length <= width || isRule(text)) return [row];

  const styled = toStyledChars(row);
  const indent = styled[0]?.ch === ' ' ? 1 : 0;

  // Split into words, each a run of non-space styled characters.
  const words: StyledChar[][] = [];
  let current: StyledChar[] = [];
  for (const c of styled) {
    if (c.ch === ' ') {
      if (current.length) words.push(current);
      current = [];
    } else {
      current.push(c);
    }
  }
  if (current.length) words.push(current);

  const lines: StyledChar[][] = [];
  const room = width - indent;
  let line: StyledChar[] = [];
  const flush = () => {
    if (line.length) lines.push(line);
    line = [];
  };

  for (let word of words) {
    while (word.length > room) {
      flush();
      lines.push(word.slice(0, room));
      word = word.slice(room);
    }
    const needed = line.length === 0 ? word.length : line.length + 1 + word.length;
    if (needed > room) flush();
    if (line.length) {
      const { color, bg } = line[line.length - 1];
      line.push({ ch: ' ', color, bg });
    }
    line.push(...word);
  }
  flush();

  return lines.map((l) => ({
    ...row,
    segments: toSegments([...Array.from({ length: indent }, () => ({ ch: ' ' })), ...l]),
  }));
};
