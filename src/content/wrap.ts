import type { GridRow, GridSegment, TeletextColor } from '../types/teletext.ts';
import { isBannerRow, isImageRow, type ImageRowSource, type RowSource } from './schema.ts';
import { layoutBanner } from './banner.ts';
import { parseMarkup } from './markup.ts';
import { autolink } from './semantic.ts';

/** Every text row starts one cell in from the screen edge. */
export const MARGIN = 1;

/** Lines starting like this indent their continuation lines to line up after the marker. */
const HANGING_MARKERS = /^([*■] |- |\d{3} +)/;

/** What a "* " list marker becomes on screen. */
export const BULLET = '■';

interface StyledChar {
  ch: string;
  leader?: boolean;
  leaderDots?: boolean;
  color?: TeletextColor;
  bg?: TeletextColor;
  link?: number;
  href?: string;
  icon?: GridSegment['icon'];
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
  for (const { ch, leader: _leader, ...style } of styled) {
    const last = segments[segments.length - 1];
    if (
      last &&
      last.color === style.color &&
      last.bg === style.bg &&
      last.link === style.link &&
      last.href === style.href &&
      last.icon === style.icon &&
      last.leaderDots === style.leaderDots
    )
      last.text += ch;
    else segments.push({ text: ch, ...style });
  }
  return segments;
};

const spaces = (n: number): StyledChar[] => Array.from({ length: n }, () => ({ ch: ' ' }));

/** A line may also break straight after these, so URLs and emails wrap in portrait. */
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
const wrapTokens = (tokens: StyledChar[][], roomFor: (line: number) => number): StyledChar[][] => {
  const lines: StyledChar[][] = [];
  let line: StyledChar[] = [];
  const room = () => roomFor(lines.length);
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

/** Turns an image row into mosaic rows `cols` wide, for a pane `width` wide (the compiler supplies the pictures). */
export type ImageRenderer = (source: ImageRowSource, width: number) => { rows: GridRow[]; cols: number; errors: string[] };

/** The narrowest text column worth putting beside a picture; anything less stacks the text below it. */
const MIN_BESIDE_COLS = 12;

const padTo = (row: GridRow, cells: number): GridSegment[] => {
  const used = row.segments.reduce((n, s) => n + chars(s.text).length, 0);
  return used < cells ? [...row.segments, { text: ' '.repeat(cells - used) }] : row.segments;
};

/**
 * An image row: the picture centred on its own, or with its `beside` text to
 * the right (left-aligned picture, one blank cell, then the text with its
 * usual margin). Text that runs past the bottom of the picture flows on
 * underneath it at full width. Where the text column would be too narrow,
 * the text goes below the centred picture.
 */
const layoutImage = (source: ImageRowSource, width: number, wrap: boolean, renderImage: ImageRenderer): LaidOutRows => {
  const image = renderImage(source, width);
  if (image.errors.length) return { rows: [], errors: image.errors, links: [] };
  const left = MARGIN + image.cols + 1;
  const besideWidth = width - left;

  if (source.beside && besideWidth >= MIN_BESIDE_COLS) {
    const text = layoutRows(source.beside, width, wrap, undefined, { rows: image.rows.length, inset: left });
    const rows = Array.from({ length: Math.max(image.rows.length, text.rows.length) }, (_, i): GridRow => {
      if (i >= image.rows.length) return text.rows[i];
      const picture = padTo(image.rows[i], image.cols);
      const words = text.rows[i]?.segments ?? [];
      return { segments: [{ text: ' '.repeat(MARGIN) }, ...picture, { text: ' ' }, ...words] };
    });
    return { rows, errors: text.errors.map((e) => `beside: ${e}`), links: text.links };
  }

  const pad = Math.floor((width - image.cols) / 2);
  const rows = image.rows.map((row) => ({ segments: pad ? [{ text: ' '.repeat(pad) }, ...row.segments] : row.segments }));
  const text = source.beside ? layoutRows(['', ...source.beside], width, wrap) : { rows: [], errors: [], links: [] };
  return { rows: [...rows, ...text.rows], errors: text.errors.map((e) => `beside: ${e}`), links: text.links };
};

/** The first `rows` rows are `inset` cells narrower, leaving room for a picture to their left. */
interface Narrowed {
  rows: number;
  inset: number;
}

/**
 * Lays out logical lines for one width. With `wrap` off (a `mobileRows`
 * override) each line is used as written and over-long lines are reported.
 * With `narrowed`, rows beside the picture are laid out without the inset,
 * for the caller to place after it; the rows below use the full width.
 */
export const layoutRows = (
  sources: RowSource[],
  width: number,
  wrap = true,
  renderImage?: ImageRenderer,
  narrowed?: Narrowed,
): LaidOutRows => {
  const rows: GridRow[] = [];
  const errors: string[] = [];
  const links: number[] = [];
  const widthAt = (row: number) => (narrowed && row < narrowed.rows ? width - narrowed.inset : width);

  sources.forEach((source, index) => {
    const where = `line ${index + 1}`;
    if (isImageRow(source)) {
      if (!renderImage) return errors.push(`${where}: images can't be used here`);
      const image = layoutImage(source, width, wrap, renderImage);
      rows.push(...image.rows);
      links.push(...image.links);
      errors.push(...image.errors.map((e) => `${where}: ${e}`));
      return;
    }
    if (isBannerRow(source)) {
      const banner = layoutBanner(source, width);
      rows.push(...banner.rows);
      errors.push(...banner.errors.map((e) => `${where}: ${e}`));
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

    const leader = body.findIndex((c) => c.leader);
    if (leader !== -1) {
      const indent = MARGIN + lead;
      const room = widthAt(rows.length);
      const dots = room - indent - (body.length - 1);
      if (dots < 1) errors.push(`${where} is too long for its "{dots}" leader at ${room} columns`);
      const expanded = [...body.slice(0, leader), ...Array.from({ length: Math.max(1, dots) }, () => ({ ...body[leader], leader: false, leaderDots: true })), ...body.slice(leader + 1)];
      rows.push({ segments: toSegments([...spaces(indent), ...expanded]), ...extra });
      return;
    }

    // A "* " list marker is drawn as a solid yellow square, as Teletext's bullets were
    if (body[0].ch === '*' && body[1]?.ch === ' ') body[0] = { ...body[0], ch: BULLET, color: 'yellow' };
    const plain = body.map((c) => c.ch).join('');
    const hang = wrap ? (plain.match(HANGING_MARKERS)?.[0].length ?? 0) : 0;
    const indent = MARGIN + lead;
    const first = rows.length;
    const lines = wrap
      ? wrapTokens(tokenize(body), (i) => widthAt(first + i) - indent - (i === 0 ? 0 : hang))
      : [trimEnd(body)];

    lines.forEach((line, i) => {
      const prefix = i === 0 ? indent : indent + hang;
      const limit = widthAt(first + i);
      if (prefix + line.length > limit) {
        errors.push(`${where} is ${prefix + line.length} cells wide; the limit is ${limit}`);
      }
      rows.push({ segments: toSegments([...spaces(prefix), ...line]), ...extra });
    });
  });

  return { rows, errors, links };
};

/** Row slots a laid-out page uses: double-height rows take two. */
export const slotsUsed = (rows: GridRow[]): number => rows.reduce((n, r) => n + (r.doubleHeight ? 2 : 1), 0);
