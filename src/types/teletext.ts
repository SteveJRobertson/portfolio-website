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

import type { IconName } from '../icons/icons.ts';

export interface GridSegment {
  text: string;
  /** An `{icon:NAME}`: the icon drawn over this segment's two cells. */
  icon?: IconName;
  color?: TeletextColor;
  bg?: TeletextColor;
  /** Target of an inline `{link:NNN}` tag: clickable in the grid, a real link in the semantic mirror. */
  link?: number;
  /** An email or web address found in the text (mailto: or https:), clickable in the grid. */
  href?: string;
  /** Block graphics from a picture: the background uses the full-strength palette so neighbouring cells blend. */
  mosaic?: boolean;
  /** A `{dots}` leader: stretched with dots to push the rest of the line to the right edge. */
  leader?: boolean;
  /** The dots a leader was stretched into, once laid out (drawn solid when its linked line is hovered). */
  leaderDots?: boolean;
  /** A `{slot:NAME}`: a fixed-width space the app fills at run time (a Flummox! score), never re-wrapped. */
  slot?: string;
  /** Inside `{answer:N}`: one of a Flummox! question's four answers (0 red to 3 cyan), answered by a click or tap. */
  answer?: number;
}

export interface GridRow {
  segments: GridSegment[];
  /** Takes two row slots, glyphs stretched from the top row (as on real Teletext). */
  doubleHeight?: boolean;
  /** Repeat this character across the rest of the width (a `{rule}` row), whatever the mode. */
  fill?: string;
  /** Extend this background to the full width when the row is fitted to a wider pane (a banner's band). */
  fillBg?: TeletextColor;
  /** Lets callers find where a row was placed (e.g. to anchor a graphic). */
  id?: string;
}

/** One Fastext slot after compilation: the target page and the label to show. */
export interface FastextLink {
  page: number;
  label: string;
}

/** A run of text in the semantic mirror: plain, a page link, or an external link (email, web address). */
export interface SemanticInline {
  text: string;
  page?: number;
  href?: string;
  /** Filled at run time, like the grid's `slot` segments. */
  slot?: string;
}

/** One block of the semantic mirror (SPEC §9), built from the logical source rows. */
export type SemanticBlock =
  | { kind: 'heading'; content: SemanticInline[] }
  | { kind: 'paragraph'; content: SemanticInline[] }
  | { kind: 'list'; items: SemanticInline[][] }
  | { kind: 'image'; alt: string };

/** A page as the app sees it: already wrapped for both widths by the content plugin. */
export interface CompiledPage {
  page: number;
  title: string;
  /** Set in the page JSON; otherwise `pageDescription` takes the start of the text. */
  description?: string;
  label: string;
  /** Listed in the widescreen quick index. */
  index: boolean;
  /** Red, green, yellow, cyan. */
  fastext: [FastextLink, FastextLink, FastextLink, FastextLink];
  /** One entry per sub-page, laid out for the 38-column pane (widescreen and classic). */
  wide: GridRow[][];
  /** One entry per sub-page, laid out for the 32-column portrait grid. */
  narrow: GridRow[][];
  /** One entry per sub-page: the same content as headings, paragraphs, lists and links. */
  semantic: SemanticBlock[][];
}
