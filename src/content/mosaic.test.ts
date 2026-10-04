import { describe, expect, it } from 'vitest';
import { PALETTE_RGB, mosaicCols, mosaicRowsFor, overfullCells, sextant, toMosaic, type RgbaImage } from './mosaic';
import { compilePages, type SourceFile } from './compile';
import { buildSemantic } from './semantic';
import type { PageSource } from './schema';
import { rowLength, rowText } from '../display/rows';
import type { TeletextColor } from '../types/teletext';

/** An image drawn pixel by pixel: `paint(x, y)` gives each pixel's colour, or null for transparent. */
const image = (width: number, height: number, paint: (x: number, y: number) => TeletextColor | null): RgbaImage => {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const c = paint(x, y);
      const i = (y * width + x) * 4;
      if (c) data.set([...PALETTE_RGB[c], 255], i);
    }
  }
  return { width, height, data };
};

describe('sextant', () => {
  it('maps all 64 patterns to distinct characters, using the block elements Unicode already had', () => {
    const chars = Array.from({ length: 64 }, (_, bits) => sextant(bits));
    expect(new Set(chars).size).toBe(64);
    expect(chars[0]).toBe(' ');
    expect(chars[0b111111]).toBe('█');
    expect(chars[0b010101]).toBe('▌');
    expect(chars[0b101010]).toBe('▐');
    expect(chars[1]).toBe('\u{1FB00}'); // top left
    expect(chars[0b111110]).toBe('\u{1FB3B}'); // all but top left
    const sextants = chars.filter((c) => c.codePointAt(0)! >= 0x1fb00);
    expect(sextants).toHaveLength(60);
    expect(sextants.every((c) => c.codePointAt(0)! <= 0x1fb3b)).toBe(true);
  });
});

describe('toMosaic', () => {
  it('sizes the picture from its height and shape', () => {
    expect(mosaicCols({ width: 100, height: 100 }, 12)).toBe(20);
    expect(mosaicRowsFor({ width: 100, height: 100 }, 20)).toBe(12);
    const rows = toMosaic(image(60, 30, () => 'white'), { rows: 3 });
    expect(rows).toHaveLength(3);
    rows.forEach((row) => expect(rowLength(row)).toBe(10));
  });

  it('draws solid cells as coloured spaces and black as plain spaces', () => {
    const [row] = toMosaic(image(4, 3, (x) => (x < 2 ? 'cyan' : 'black')), { rows: 1 });
    expect(row.segments).toEqual([
      { text: ' ', mosaic: true, bg: 'cyan' },
      { text: ' ', mosaic: true },
    ]);
    expect(rowText(row)).toBe('  ');
  });

  it('splits a cell between two colours, keeping black as the background', () => {
    // Left column yellow, right column black: the left half block in yellow.
    const [left] = toMosaic(image(2, 3, (x) => (x === 0 ? 'yellow' : 'black')), { rows: 1 });
    expect(left.segments).toEqual([{ text: '▌', mosaic: true, color: 'yellow' }]);
    // Top row red on white: one sextant, red foreground, white background.
    const [top] = toMosaic(image(2, 3, (_, y) => (y === 0 ? 'red' : 'white')), { rows: 1 });
    expect(top.segments).toEqual([{ text: sextant(0b000011), mosaic: true, color: 'red', bg: 'white' }]);
  });

  it('draws a checkerboard pixel for pixel', () => {
    const [row] = toMosaic(image(4, 3, (x, y) => ((x + y) % 2 ? 'white' : 'black')), { rows: 1 });
    expect(rowText(row)).toBe(sextant(0b100110).repeat(2)); // top right, middle left, bottom right
  });

  it('treats transparent pixels as the black screen', () => {
    const [row] = toMosaic(image(2, 3, (x) => (x === 1 ? 'green' : null)), { rows: 1 });
    expect(row.segments).toEqual([{ text: '▐', mosaic: true, color: 'green' }]);
  });

  it('keeps to the palette it is given', () => {
    const rows = toMosaic(image(8, 6, (x) => (x < 4 ? 'blue' : 'magenta')), { rows: 2, palette: ['black', 'white'] });
    const colours = rows.flatMap((r) => r.segments.flatMap((s) => [s.color, s.bg])).filter(Boolean);
    expect(colours.every((c) => c === 'white')).toBe(true);
  });
});

const page = (rows: PageSource['rows']): SourceFile => ({
  file: 'page100.json',
  data: { page: 100, title: 'Index', label: 'INDEX', fastext: [{ page: 100 }, { page: 100 }, { page: 100 }, { page: 100 }], rows },
});
const square = image(30, 30, (x, y) => (x > 5 && x < 24 && y > 5 && y < 24 ? 'white' : null));

describe('image rows', () => {
  it('centres the picture in both layouts and fits portrait to 20 columns', () => {
    const { pages, errors } = compilePages([page([{ image: 'square', alt: 'A white square.', rows: 18 }])], { square });
    expect(errors).toEqual([]);
    expect(pages[0].wide[0]).toHaveLength(18);
    expect(rowText(pages[0].wide[0][0]).length).toBe(4 + 30); // 30 wide, centred in 38
    expect(pages[0].narrow[0]).toHaveLength(12); // 20 columns of a square
    pages[0].narrow[0].forEach((row) => expect(rowLength(row)).toBeLessThanOrEqual(20));
  });

  it('uses mobileRows for the portrait height', () => {
    const { pages } = compilePages([page([{ image: 'square', alt: 'A square.', rows: 6, mobileRows: 9 }])], { square });
    expect(pages[0].narrow[0]).toHaveLength(9);
  });

  it('puts the alt text in the semantic mirror', () => {
    expect(buildSemantic(['Hi', { image: 'square', alt: 'A white square.', rows: 6 }])).toEqual([
      { kind: 'paragraph', content: [{ text: 'Hi' }] },
      { kind: 'image', alt: 'A white square.' },
    ]);
  });

  // 8 × 6 pixels: 4 cells by 2 rows, drawn as is.
  const art = image(8, 6, (x, y) => (y < 3 ? (x < 4 ? 'red' : 'cyan') : x % 2 ? 'white' : null));

  it('uses pixel art as drawn, with no scaling', () => {
    const { pages, errors } = compilePages([page([{ image: 'art', alt: 'Art.', rows: 2, pixelArt: true }])], { art });
    expect(errors).toEqual([]);
    const rows = pages[0].wide[0];
    expect(rows).toHaveLength(2);
    expect(rowText(rows[0]).trim()).toBe('');
    expect(rows[0].segments.filter((s) => s.bg).map((s) => s.bg)).toEqual(['red', 'cyan']);
    expect(rowText(rows[1]).trim()).toBe('▐▐▐▐');
  });

  it('puts text beside a picture on wide screens and below it in portrait', () => {
    const beside = ['{green}TECH{/} React', 'Hello there'];
    // The square is 10 cells wide at 6 rows: room for text beside it at 38 columns, not at 20.
    const { pages, errors } = compilePages([page([{ image: 'square', alt: 'Square.', rows: 6, beside }])], { square });
    expect(errors).toEqual([]);
    const wide = pages[0].wide[0].map(rowText);
    expect(wide).toHaveLength(6);
    expect(wide[0]).toMatch(/^ .{10}  TECH React$/u); // margin, 10 cells of picture, a gap, the text with its margin
    expect(wide[1]).toMatch(/^ .{10}  Hello there$/u);
    const narrow = pages[0].narrow[0].map(rowText);
    expect(narrow.slice(-3)).toEqual(['', ' TECH React', ' Hello there']);
    expect(pages[0].semantic[0].map((b) => b.kind)).toEqual(['image', 'paragraph', 'paragraph']);
  });

  it('finds pixel-art cells with more than two colours (transparent counts as black)', () => {
    expect(overfullCells(art)).toEqual([]);
    const three = image(2, 3, (x, y) => (y === 0 ? 'red' : y === 1 ? 'white' : x ? 'blue' : null));
    expect(overfullCells(three)).toEqual(['1,1']);
  });

  const errorsFor = (rows: PageSource['rows']) => compilePages([page(rows)], { square, art }).errors.join('\n');

  it('rejects pixel art of the wrong size, the wrong height or too many colours a cell', () => {
    const odd = image(3, 3, () => 'white');
    expect(compilePages([page([{ image: 'odd', alt: 'x', rows: 1, pixelArt: true }])], { odd }).errors.join()).toContain(
      'must be 2 pixels a column and 3 a row',
    );
    expect(errorsFor([{ image: 'art', alt: 'x', rows: 3, pixelArt: true }])).toContain('is 2 rows tall, so "rows" must be 2');
    const three = image(2, 3, (_, y) => (['red', 'white', 'blue'] as const)[y]);
    expect(compilePages([page([{ image: 'three', alt: 'x', rows: 1, pixelArt: true }])], { three }).errors.join()).toContain(
      'more than two colours in cell(s) 1,1',
    );
  });

  it('rejects missing pictures, empty alt text, pictures that are too big and bad options', () => {
    expect(errorsFor([{ image: 'nope', alt: 'x', rows: 4 }])).toContain('image "nope" isn\'t in src/content/images');
    expect(errorsFor([{ image: 'square', alt: ' ', rows: 4 }])).toContain('needs "alt" text');
    expect(errorsFor([{ image: 'square', alt: 'x', rows: 24 }])).toContain('is 40 cells wide at 24 rows; the limit is 38');
    expect(errorsFor(['x', { image: 'square', alt: 'x', rows: 22 }])).toContain('needs 23 rows; the limit is 22');
    expect(errorsFor([{ image: 'square', alt: 'x', rows: 4, palette: ['orange'] } as never])).toContain('"rows" must be a list');
    expect(errorsFor([{ image: 'square', rows: 4 } as never])).toContain('an image needs image, alt and rows');
  });
});
