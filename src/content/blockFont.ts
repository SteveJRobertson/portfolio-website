/**
 * Block letters for page banners, drawn in mosaic pixels (2 × 3 a cell) the
 * way Ceefax drew its section headers. Each glyph is six pixels tall, so a
 * line of letters fills two grid rows. `#` is a lit pixel.
 *
 * Two weights come from one thin outline: `bold` thickens every stroke to the
 * right, and `condensed` keeps letters four pixels wide with a heavy left stem,
 * for titles too long to set in bold. A few letters are drawn by hand in each.
 */

type Glyph = readonly string[];

const THIN: Record<string, Glyph> = {
  A: ['.##.', '#..#', '#..#', '####', '#..#', '#..#'],
  B: ['###.', '#..#', '###.', '#..#', '#..#', '###.'],
  C: ['.###', '#...', '#...', '#...', '#...', '.###'],
  D: ['###.', '#..#', '#..#', '#..#', '#..#', '###.'],
  E: ['####', '#...', '###.', '#...', '#...', '####'],
  F: ['####', '#...', '###.', '#...', '#...', '#...'],
  G: ['.###', '#...', '#...', '#.##', '#..#', '.###'],
  H: ['#..#', '#..#', '####', '#..#', '#..#', '#..#'],
  I: ['###', '.#.', '.#.', '.#.', '.#.', '###'],
  J: ['..##', '...#', '...#', '...#', '#..#', '.##.'],
  K: ['#..#', '#.#.', '##..', '#.#.', '#..#', '#..#'],
  L: ['#...', '#...', '#...', '#...', '#...', '####'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#..#', '##.#', '#.##', '#..#', '#..#', '#..#'],
  O: ['.##.', '#..#', '#..#', '#..#', '#..#', '.##.'],
  P: ['###.', '#..#', '#..#', '###.', '#...', '#...'],
  Q: ['.##.', '#..#', '#..#', '#..#', '#.#.', '.#.#'],
  R: ['###.', '#..#', '#..#', '###.', '#.#.', '#..#'],
  S: ['.###', '#...', '.##.', '...#', '...#', '###.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#..#', '#..#', '#..#', '#..#', '#..#', '.##.'],
  V: ['#...#', '#...#', '#...#', '.#.#.', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '##.##', '#...#'],
  X: ['#..#', '#..#', '.##.', '.##.', '#..#', '#..#'],
  Y: ['#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['####', '...#', '..#.', '.#..', '#...', '####'],
  '0': ['.##.', '#..#', '#.##', '##.#', '#..#', '.##.'],
  '1': ['.#.', '##.', '.#.', '.#.', '.#.', '###'],
  '2': ['.##.', '#..#', '..#.', '.#..', '#...', '####'],
  '3': ['###.', '...#', '.##.', '...#', '...#', '###.'],
  '4': ['#..#', '#..#', '####', '...#', '...#', '...#'],
  '5': ['####', '#...', '###.', '...#', '...#', '###.'],
  '6': ['.##.', '#...', '###.', '#..#', '#..#', '.##.'],
  '7': ['####', '...#', '..#.', '.#..', '.#..', '.#..'],
  '8': ['.##.', '#..#', '.##.', '#..#', '#..#', '.##.'],
  '9': ['.##.', '#..#', '#..#', '.###', '...#', '.##.'],
  '-': ['...', '...', '###', '...', '...', '...'],
  '/': ['...#', '..#.', '..#.', '.#..', '.#..', '#...'],
  '&': ['.#..', '#.#.', '.#..', '#.#.', '#..#', '.##.'],
  '!': ['#', '#', '#', '#', '.', '#'],
  '?': ['.##.', '#..#', '..#.', '.#..', '....', '.#..'],
  '.': ['.', '.', '.', '.', '.', '#'],
  "'": ['#', '#', '.', '.', '.', '.'],
  ' ': ['..', '..', '..', '..', '..', '..'],
};

const BOLD_OVERRIDES: Record<string, Glyph> = {
  I: ['##', '##', '##', '##', '##', '##'],
  M: ['##...##', '###.###', '##.#.##', '##...##', '##...##', '##...##'],
  N: ['##..##', '###.##', '######', '##.###', '##..##', '##..##'],
  T: ['######', '..##..', '..##..', '..##..', '..##..', '..##..'],
  V: ['##..##', '##..##', '##..##', '##..##', '.####.', '..##..'],
  W: ['##...##', '##...##', '##...##', '##.#.##', '###.###', '##...##'],
  Y: ['##..##', '##..##', '.####.', '..##..', '..##..', '..##..'],
};

const CONDENSED_OVERRIDES: Record<string, Glyph> = {
  K: ['##.#', '###.', '##..', '###.', '##.#', '##.#'],
  N: ['##.#', '####', '####', '##.#', '##.#', '##.#'],
  T: ['####', '.##.', '.##.', '.##.', '.##.', '.##.'],
  V: ['##.#', '##.#', '##.#', '##.#', '.##.', '.##.'],
  Y: ['##.#', '##.#', '.##.', '.##.', '.##.', '.##.'],
};

/** Every stroke one pixel wider, to the right. */
const embolden = (glyph: Glyph): Glyph =>
  glyph.map((row) => Array.from({ length: row.length + 1 }, (_, x) => (row[x] === '#' || row[x - 1] === '#' ? '#' : '.')).join(''));

/** Doubles a stem on the left edge, keeping the width. */
const heavyLeft = (glyph: Glyph): Glyph => glyph.map((row) => (row.startsWith('#.') ? `##${row.slice(2)}` : row));

export type BlockWeight = 'bold' | 'condensed';

const glyphFor = (ch: string, weight: BlockWeight): Glyph | undefined => {
  const thin = THIN[ch];
  if (!thin || ch === ' ' || ch === '-' || ch === '.' || ch === "'" || ch === '!') return thin;
  if (weight === 'bold') return BOLD_OVERRIDES[ch] ?? embolden(thin);
  return CONDENSED_OVERRIDES[ch] ?? heavyLeft(thin);
};

export const BLOCK_HEIGHT = 6;

/** Characters the block font can't draw. Letters are upper-cased first. */
export const unsupportedChars = (text: string): string[] => [...new Set(Array.from(text.toUpperCase()).filter((ch) => !THIN[ch]))];

/**
 * Draws a run of text as a pixel bitmap: six strings of `#` and `.`, with one
 * blank pixel between letters. Unknown characters are skipped (check with
 * `unsupportedChars` first).
 */
export const blockBitmap = (text: string, weight: BlockWeight): string[] => {
  const glyphs = Array.from(text.toUpperCase())
    .map((ch) => glyphFor(ch, weight))
    .filter((g): g is Glyph => g !== undefined);
  return Array.from({ length: BLOCK_HEIGHT }, (_, y) => glyphs.map((g) => g[y]).join('.'));
};
