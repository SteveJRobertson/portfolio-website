import type { GridRow, GridSegment, TeletextColor } from '../types/teletext.ts';

/**
 * The build-time image converter (SPEC §8): turns a picture into rows of 2×3
 * mosaic characters in the Teletext palette, drawn on the grid like any text.
 */

/** Decoded pixels, four bytes (RGBA) each, row by row. */
export interface RgbaImage {
  width: number;
  height: number;
  data: ArrayLike<number>;
}

export interface MosaicOptions {
  /** Height in grid rows. The width follows the picture's shape. */
  rows: number;
  /** Colours the picture may use. Black is the screen background. */
  palette?: readonly TeletextColor[];
  /** 1 leaves the picture as it is; above 1 strengthens it. */
  contrast?: number;
  saturation?: number;
  brightness?: number;
}

/** The screen colours (the design tokens), used to match pixels. */
export const PALETTE_RGB: Record<TeletextColor, readonly [number, number, number]> = {
  black: [12, 12, 12],
  red: [255, 51, 51],
  green: [0, 255, 0],
  yellow: [255, 255, 0],
  blue: [77, 121, 255],
  magenta: [255, 0, 255],
  cyan: [0, 255, 255],
  white: [255, 255, 255],
};

const ALL_COLOURS = Object.keys(PALETTE_RGB) as TeletextColor[];

/**
 * A mosaic cell is 0.6em × 1em, split 2 across and 3 down, so each of its
 * pixels is 0.3em × 0.33em. Keeping a picture's shape takes 5/3 as many
 * columns as rows per unit of aspect ratio.
 */
export const mosaicCols = (image: Pick<RgbaImage, 'width' | 'height'>, rows: number): number =>
  Math.max(1, Math.round(((rows * image.width) / image.height) * (5 / 3)));

/** The most rows that keep a picture within `cols` columns. */
export const mosaicRowsFor = (image: Pick<RgbaImage, 'width' | 'height'>, cols: number): number =>
  Math.max(1, Math.floor((cols * image.height * 3) / (image.width * 5)));

/**
 * The character for a cell's six pixels. Bit 0 is top left, bit 1 top right,
 * then the middle and bottom pairs. Unicode's sextant block (U+1FB00) skips
 * the three patterns that already exist: the left and right halves, and full.
 */
export const sextant = (bits: number): string => {
  if (bits === 0) return ' ';
  if (bits === 0b111111) return '█';
  if (bits === 0b010101) return '▌';
  if (bits === 0b101010) return '▐';
  return String.fromCodePoint(0x1fb00 + bits - 1 - (bits > 0b010101 ? 1 : 0) - (bits > 0b101010 ? 1 : 0));
};

const clamp = (v: number) => Math.min(255, Math.max(0, v));
const luma = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

/** Flattens transparency onto the black screen and applies the tweaks (in the same way as common image editors). */
const prepare = (image: RgbaImage, { contrast = 1, saturation = 1, brightness = 1 }: MosaicOptions): Float64Array => {
  const n = image.width * image.height;
  const px = new Float64Array(n * 3);
  const [br, bg, bb] = PALETTE_RGB.black;
  for (let i = 0; i < n; i++) {
    const a = image.data[i * 4 + 3] / 255;
    px[i * 3] = image.data[i * 4] * a + br * (1 - a);
    px[i * 3 + 1] = image.data[i * 4 + 1] * a + bg * (1 - a);
    px[i * 3 + 2] = image.data[i * 4 + 2] * a + bb * (1 - a);
  }
  if (saturation !== 1) {
    for (let i = 0; i < n; i++) {
      const l = luma(px[i * 3], px[i * 3 + 1], px[i * 3 + 2]);
      for (let c = 0; c < 3; c++) px[i * 3 + c] = clamp(l + (px[i * 3 + c] - l) * saturation);
    }
  }
  if (contrast !== 1) {
    let total = 0;
    for (let i = 0; i < n; i++) total += luma(px[i * 3], px[i * 3 + 1], px[i * 3 + 2]);
    const mean = total / n;
    for (let i = 0; i < n * 3; i++) px[i] = clamp(mean + (px[i] - mean) * contrast);
  }
  if (brightness !== 1) {
    for (let i = 0; i < n * 3; i++) px[i] = clamp(px[i] * brightness);
  }
  return px;
};

/** Scales down by averaging every source pixel each target pixel covers, including partly covered ones. */
const shrink = (px: Float64Array, width: number, height: number, w: number, h: number): Float64Array => {
  const out = new Float64Array(w * h * 3);
  const sx = width / w;
  const sy = height / h;
  for (let ty = 0; ty < h; ty++) {
    const y0 = ty * sy;
    const y1 = y0 + sy;
    for (let tx = 0; tx < w; tx++) {
      const x0 = tx * sx;
      const x1 = x0 + sx;
      let r = 0;
      let g = 0;
      let b = 0;
      let area = 0;
      for (let y = Math.floor(y0); y < Math.min(height, Math.ceil(y1)); y++) {
        const fy = Math.min(y + 1, y1) - Math.max(y, y0);
        for (let x = Math.floor(x0); x < Math.min(width, Math.ceil(x1)); x++) {
          const f = fy * (Math.min(x + 1, x1) - Math.max(x, x0));
          const i = (y * width + x) * 3;
          r += px[i] * f;
          g += px[i + 1] * f;
          b += px[i + 2] * f;
          area += f;
        }
      }
      const o = (ty * w + tx) * 3;
      out[o] = r / area;
      out[o + 1] = g / area;
      out[o + 2] = b / area;
    }
  }
  return out;
};

/** Squared colour distance, weighted the way the eye weighs red, green and blue. */
const distance = (r: number, g: number, b: number, [pr, pg, pb]: readonly number[]) =>
  0.9 * (r - pr) ** 2 + 1.77 * (g - pg) ** 2 + 0.33 * (b - pb) ** 2;

interface Cell {
  ch: string;
  color?: TeletextColor;
  bg?: TeletextColor;
}

/**
 * Picks the best two colours for a cell's six pixels (one may be black), and
 * which pixels take which. There's no dithering: at 2×3 pixels a cell it only
 * adds speckle.
 */
const cellFor = (pixels: number[][], palette: readonly TeletextColor[]): Cell => {
  const d = pixels.map(([r, g, b]) => palette.map((c) => distance(r, g, b, PALETTE_RGB[c])));
  let best = { error: Infinity, a: 0, b: 0 };
  for (let a = 0; a < palette.length; a++) {
    for (let b = a; b < palette.length; b++) {
      const error = d.reduce((sum, row) => sum + Math.min(row[a], row[b]), 0);
      if (error < best.error) best = { error, a, b };
    }
  }
  // A solid cell is a space on a coloured background, so runs of them have no seams between glyphs.
  const solid = (c: TeletextColor): Cell => (c === 'black' ? { ch: ' ' } : { ch: ' ', bg: c });
  let fg = palette[best.a];
  let bg = palette[best.b];
  let bits = d.reduce((n, row, i) => (row[best.a] <= row[best.b] ? n | (1 << i) : n), 0);
  if (fg === bg || bits === 0b111111) return solid(fg);
  if (bits === 0) return solid(bg);
  // Keep black as the background, so most cells need no background colour.
  if (fg === 'black') {
    [fg, bg] = [bg, fg];
    bits ^= 0b111111;
  }
  return { ch: sextant(bits), color: fg, ...(bg !== 'black' && { bg }) };
};

/** Joins neighbouring cells of the same colours into segments. A space only needs the same background. */
const toSegments = (cells: Cell[]): GridSegment[] => {
  const segments: GridSegment[] = [];
  for (const cell of cells) {
    const last = segments[segments.length - 1];
    const blank = cell.ch === ' ';
    if (last && last.bg === cell.bg && (blank || last.color === cell.color)) {
      last.text += cell.ch;
    } else {
      segments.push({ text: cell.ch, mosaic: true, ...(cell.color && { color: cell.color }), ...(cell.bg && { bg: cell.bg }) });
    }
  }
  return segments;
};

/** Converts a picture to `rows` rows of mosaic cells, as wide as its shape needs. */
export const toMosaic = (image: RgbaImage, options: MosaicOptions): GridRow[] => {
  const palette = options.palette?.length ? options.palette : ALL_COLOURS;
  const rows = options.rows;
  const cols = mosaicCols(image, rows);
  const w = cols * 2;
  const h = rows * 3;
  const px = shrink(prepare(image, options), image.width, image.height, w, h);
  const at = (x: number, y: number) => {
    const i = (y * w + x) * 3;
    return [px[i], px[i + 1], px[i + 2]];
  };

  return Array.from({ length: rows }, (_, r) => {
    const cells = Array.from({ length: cols }, (_, c) => {
      const pixels = [0, 1, 2].flatMap((dy) => [at(c * 2, r * 3 + dy), at(c * 2 + 1, r * 3 + dy)]);
      return cellFor(pixels, palette);
    });
    return { segments: toSegments(cells) };
  });
};
