import { GRID_MODES, bodyRowCount } from '../display/gridModes.ts';
import type { TeletextColor } from '../types/teletext.ts';

/**
 * The page source format (SPEC §7): one JSON file per page in
 * `src/content/pages/`, written once with colour tags and wrapped at build time.
 */

/**
 * A logical line. A plain string, or an object to make it double height, mark
 * it as a heading in the semantic mirror, or keep it out of the mirror
 * (`screenOnly`, for hints like "Press ← or →" that only make sense on screen).
 */
export type TextRowSource = string | { text: string; doubleHeight?: boolean; heading?: boolean; screenOnly?: boolean };

/**
 * A picture from `src/content/images/<image>.png`, converted to mosaic cells
 * at build time (SPEC §8). `rows` is its height in the 38-column layout; the
 * width follows its shape. Portrait fits it into 20 columns, or uses
 * `mobileRows`. `alt` is its text in the semantic mirror and Text mode.
 */
export interface ImageRowSource {
  image: string;
  alt: string;
  rows: number;
  mobileRows?: number;
  /** The PNG is drawn at 2 × 3 pixels a cell in palette colours, two a cell: used as drawn, never scaled. */
  pixelArt?: boolean;
  /** Text laid out to the right of the picture, as on a Ceefax page; below it in portrait. */
  beside?: TextRowSource[];
  /** Colours it may use (all eight when left out). */
  palette?: TeletextColor[];
  contrast?: number;
  saturation?: number;
  brightness?: number;
}

/**
 * A page banner: the title in mosaic block letters on a band of colour (SPEC §7).
 * `banner` may use colour tags for the letters; `bg` is the band.
 */
export interface BannerRowSource {
  banner: string;
  bg: TeletextColor;
}

export type RowSource = TextRowSource | ImageRowSource | BannerRowSource;

export const ROW_KEYS = ['text', 'doubleHeight', 'heading', 'screenOnly'] as const;
export const IMAGE_KEYS = ['image', 'alt', 'rows', 'mobileRows', 'pixelArt', 'beside', 'palette', 'contrast', 'saturation', 'brightness'] as const;

export const BANNER_KEYS = ['banner', 'bg'] as const;

export const isImageRow = (row: RowSource): row is ImageRowSource => typeof row === 'object' && 'image' in row;
export const isBannerRow = (row: RowSource): row is BannerRowSource => typeof row === 'object' && 'banner' in row;

export interface FastextSource {
  page: number;
  /** Defaults to the target page's `label`. */
  label?: string;
}

export interface PageSource {
  /** 100–899, and must match the file name (`page110.json`). */
  page: number;
  title: string;
  /** Short name for the quick index and Fastext, e.g. "ABOUT". */
  label: string;
  /** List the page in the widescreen quick index. */
  index?: boolean;
  /** Red, green, yellow, cyan. */
  fastext: [FastextSource, FastextSource, FastextSource, FastextSource];
  /** A single page… */
  rows?: RowSource[];
  /** …or several sub-pages. */
  subpages?: RowSource[][];
  /** Portrait override, used line for line instead of the automatic wrap. */
  mobileRows?: RowSource[];
  mobileSubpages?: RowSource[][];
}

/** The widescreen main pane width (38). Classic shows the same line breaks with two cells spare. */
export const WIDE_COLS = GRID_MODES.widescreen.mainCols;
export const NARROW_COLS = GRID_MODES.portrait.mainCols;

/** Body rows between the header and Fastext (22 and 34). */
export const WIDE_BODY_ROWS = bodyRowCount(GRID_MODES.widescreen);
export const NARROW_BODY_ROWS = bodyRowCount(GRID_MODES.portrait);
