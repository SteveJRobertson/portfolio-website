import type { GridRow, GridSegment, TeletextColor } from '../types/teletext.ts';
import { isImageRow, type ImageRowSource, type RowSource } from './schema.ts';
import { parseMarkup } from './markup.ts';
import { autolink } from './semantic.ts';

/** Every text row starts one cell in from the screen edge. */
export const MARGIN = 1;

/** Lines starting like this indent their continuation lines to line up after the marker. */
const HANGING_MARKERS = /^(\* |- |\d{3} +)/;

interface StyledChar {
  ch: string;
  color?: TeletextColor;
  bg?: TeletextColor;
  link?: number;
  href?: string;
}

export interface LaidOutRows {
  rows: GridRow[];
  errors: string[];
  links: number[];
}

// Mosaic sextants are astral code points, so work in code points rather than UTF-16 units.
const chars = (text: string): string[] => Array.from(text);

const toStyledChars = (segments: GridSegment[]): StyledChar[] =>
  segments.flatMap(({ text, ...style }) => chars(text).map((ch) => ({ ch, ...style })));

const toSegments = (styled: StyledChar[]): GridSegment[] => {
  const segments: GridSegment[] = [];
  for (const { ch, ...style } of styled) {
    const last = segments[segments.length - 1];
    if (last && last.color === style.color && last.bg === style.bg && last.link === style.link && last.href === style.href) last.text += ch;
    else segments.push({ text: ch, ...style });
  }
  return segments;
};

const spaces = (n: number): StyledChar[] => Array.from({ length: n }, () => ({ ch: ' ' }));

/** A line may also break straight after these, so URLs and emails wrap at 20 columns. */
const BREAK_AFTER = new Set(['/', '-', '@']);

/**
 * Splits into runs of spaces and words, keeping each run's styling. Words are
 * also split after a break character, with no space between the pieces.
 */
const tokenize = (styled: StyledChar[]): StyledChar[][] => {
  const tokens: StyledChar[][] = [];
  for (const c of styled) {
    const last = tokens[tokens.length - 1];
    const prev = last?.[last.length - 1];
    const sameKind = last && (last[0].ch === ' ') === (c.ch === ' ');
    if (sameKind && !(c.ch !== ' ' && BREAK_AFTER.has(prev!.ch))) last.push(c);
    else tokens.push([c]);
  }
  return tokens;
};

const trimEnd = (line: StyledChar[]): StyledChar[] => {
  let end = line.length;
  while (end > 0 && line[end - 1].ch === ' ' && !line[end - 1].bg) end--;
  return line.slice(0, end);
};

/**
 * Greedy word wrap. Space runs inside a line are kept (for aligned columns);
 * the spaces at a break are dropped. Words longer than a line are hard-split.
 */
const wrapTokens = (tokens: StyledChar[][], firstRoom: number, nextRoom: number): StyledChar[][] => {
  const lines: StyledChar[][] = [];
  let line: StyledChar[] = [];
  const room = () => (lines.length === 0 ? firstRoom : nextRoom);
  const flush = () => {
    lines.push(trimEnd(line));
    line = [];
  };

  for (let token of tokens) {
    const isSpace = token[0].ch === ' ';
    if (isSpace) {
      if (line.length > 0) line.push(...token);
      continue;
    }
    if (line.length + token.length > room()) {
      if (trimEnd(line).length > 0) flush();
      else line = [];
      while (token.length > room()) {
        lines.push(token.slice(0, room()));
        token = token.slice(room());
      }
    }
    line.push(...token);
  }
  if (line.length > 0 || lines.length === 0) flush();
  return lines;
};

/** Turns an image row into mosaic rows for one width (the compiler supplies the pictures). */
export type ImageRenderer = (source: ImageRowSource, width: number) => { rows: GridRow[]; errors: string[] };

/**
 * Lays out logical lines for one width. With `wrap` off (a `mobileRows`
 * override) each line is used as written and over-long lines are reported.
 */
export const layoutRows = (sources: RowSource[], width: number, wrap = true, renderImage?: ImageRenderer): LaidOutRows => {
  const rows: GridRow[] = [];
  const errors: string[] = [];
  const links: number[] = [];

  sources.forEach((source, index) => {
    const where = `line ${index + 1}`;
    if (isImageRow(source)) {
      if (!renderImage) return errors.push(`${where}: images can't be used here`);
      const image = renderImage(source, width);
      rows.push(...image.rows);
      errors.push(...image.errors.map((e) => `${where}: ${e}`));
      return;
    }
    const { text, doubleHeight } = typeof source === 'string' ? { text: source, doubleHeight: false } : source;
    const parsed = parseMarkup(text);
    errors.push(...parsed.errors.map((e) => `${where}: ${e}`));
    links.push(...parsed.links);
    const extra: Partial<GridRow> = doubleHeight ? { doubleHeight: true } : {};

    if (parsed.fill !== undefined) {
      rows.push({ segments: [{ text: '', color: parsed.fillColor }], fill: parsed.fill, ...extra });
      return;
    }

    // Email and web addresses keep their full target on every wrapped piece, so each piece opens it.
    const segments = parsed.segments.flatMap((seg) =>
      seg.link !== undefined ? [seg] : autolink(seg.text).map(({ text, href }) => (href ? { ...seg, text, href } : { ...seg, text })),
    );
    const styled = toStyledChars(segments);
    let lead = 0;
    while (lead < styled.length && styled[lead].ch === ' ' && !styled[lead].bg) lead++;
    const body = styled.slice(lead);
    if (body.length === 0) {
      rows.push({ segments: [], ...extra });
      return;
    }

    const plain = body.map((c) => c.ch).join('');
    const hang = wrap ? (plain.match(HANGING_MARKERS)?.[0].length ?? 0) : 0;
    const indent = MARGIN + lead;
    const lines = wrap
      ? wrapTokens(tokenize(body), width - indent, width - indent - hang)
      : [trimEnd(body)];

    lines.forEach((line, i) => {
      const prefix = i === 0 ? indent : indent + hang;
      if (prefix + line.length > width) {
        errors.push(`${where} is ${prefix + line.length} cells wide; the limit is ${width}`);
      }
      rows.push({ segments: toSegments([...spaces(prefix), ...line]), ...extra });
    });
  });

  return { rows, errors, links };
};

/** Row slots a laid-out page uses: double-height rows take two. */
export const slotsUsed = (rows: GridRow[]): number => rows.reduce((n, r) => n + (r.doubleHeight ? 2 : 1), 0);
