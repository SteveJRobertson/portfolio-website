export type TeletextColor =
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'black';

export const TELETEXT_COLORS: readonly TeletextColor[] = [
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'black',
];

export interface GridSegment {
  text: string;
  color?: TeletextColor;
  bg?: TeletextColor;
  /** Target of an inline `{link:NNN}` tag; Phase 4 turns it into a real link in the semantic tree. */
  link?: number;
}

export interface GridRow {
  segments: GridSegment[];
  /** Takes two row slots, glyphs stretched from the top row (as on real Teletext). */
  doubleHeight?: boolean;
  /** Repeat this character across the whole width (a `{rule}` row), whatever the mode. */
  fill?: string;
  /** Lets callers find where a row was placed (e.g. to anchor a graphic). */
  id?: string;
}

/** One Fastext slot after compilation: the target page and the label to show. */
export interface FastextLink {
  page: number;
  label: string;
}

/** A page as the app sees it: already wrapped for both widths by the content plugin. */
export interface CompiledPage {
  page: number;
  title: string;
  label: string;
  /** Listed in the widescreen quick index. */
  index: boolean;
  /** Red, green, yellow, cyan. */
  fastext: [FastextLink, FastextLink, FastextLink, FastextLink];
  /** One entry per sub-page, laid out for the 38-column pane (widescreen and classic). */
  wide: GridRow[][];
  /** One entry per sub-page, laid out for the 20-column portrait grid. */
  narrow: GridRow[][];
}
