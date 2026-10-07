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
 * width follows its shape. Portrait fits it into 32 columns, or uses
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
  /** `right` puts the picture at the right edge with the `beside` text to its left, as Bamboozle! drew its quizmaster. */
  align?: 'right';
  /** Colours it may use (all eight when left out). */
  palette?: TeletextColor[];
  contrast?: number;
  saturation?: number;
  brightness?: number;
}

/**
 * A page banner: the title in mosaic block letters on a band of colour (SPEC §7).
 * `banner` may use colour tags for the letters; `bg` is the band. On black (`bg: "black"`) it's a
 * mixed-case masthead over a thin line in the `rule` colour (the letters' colour if left out).
 */
export interface BannerRowSource {
  banner: string;
  bg: TeletextColor;
  rule?: TeletextColor;
}

export type RowSource = TextRowSource | ImageRowSource | BannerRowSource;

export const ROW_KEYS = ['text', 'doubleHeight', 'heading', 'screenOnly'] as const;
export const IMAGE_KEYS = ['image', 'alt', 'rows', 'mobileRows', 'pixelArt', 'beside', 'align', 'palette', 'contrast', 'saturation', 'brightness'] as const;

export const BANNER_KEYS = ['banner', 'bg', 'rule'] as const;

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
  /** For search results and link previews; defaults to the start of the page's text. */
  description?: string;
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
  /**
   * With sub-pages: the line that says how to step through them, e.g.
   * "{white}Press ← or → for more roles.{/}". It's drawn in the last body row
   * of every sub-page (on screen only), so it never moves.
   */
  hint?: string;
  /** Portrait override, used line for line instead of the automatic wrap. */
  mobileRows?: RowSource[];
  mobileSubpages?: RowSource[][];
}

/**
 * The width text is set to on the 40-column screens (classic, and widescreen's main pane): 38,
 * leaving two cells spare at the right, as on Ceefax. Banners extend their band into them.
 */
export const WIDE_COLS = GRID_MODES.classic.mainCols - 2;
export const NARROW_COLS = GRID_MODES.portrait.mainCols;

/** Body rows between the header and Fastext (22 and 34). */
export const WIDE_BODY_ROWS = bodyRowCount(GRID_MODES.widescreen);
export const NARROW_BODY_ROWS = bodyRowCount(GRID_MODES.portrait);
