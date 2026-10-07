import { TELETEXT_COLORS, type GridSegment, type TeletextColor } from '../types/teletext.ts';
import { sextant } from './mosaic.ts';
import { ICONS, type IconName } from '../icons/icons.ts';

/**
 * Colour-tag markup for one logical line (SPEC §7):
 *
 *   {cyan}TEXT{/}        foreground colour
 *   {bg:blue}TEXT{/}     background colour
 *   {link:201}TEXT{/}    inline page link (cyan unless a colour is set inside it)
 *   {rule} / {rule:-}    a full-width rule; the only thing on its row, colour from the enclosing tag.
 *                        {rule} is a solid mosaic bar; {rule:X} repeats X
 *   {dots}               a leader: dots that push the rest of the line to the right edge
 *   {icon:linkedin}      an icon (src/icons), two cells wide and one line tall
 *   {slot:score}         a fixed-width space filled at run time (see SLOT_WIDTHS)
 *   {answer:0}TEXT{/}    a Flummox! answer (0 red to 3 cyan), clickable in the grid
 *   {{                   a literal "{"
 *
 * Tags nest, `{/}` closes the most recent one, and every tag must be closed by
 * the end of the line. Text outside any colour tag is white.
 */

export interface ParsedLine {
  segments: GridSegment[];
  /** Set when the line is a `{rule}`: the character to repeat. */
  fill?: string;
  fillColor?: TeletextColor;
  /** Every `{link:NNN}` target, for the validator. */
  links: number[];
  errors: string[];
}

interface Style {
  color?: TeletextColor;
  bg?: TeletextColor;
  link?: number;
  answer?: number;
}

/**
 * The run-time slots and how many cells each takes. The width is fixed, so a
 * screen that fits at build time still fits once the app fills it in.
 */
export const SLOT_WIDTHS: Record<string, number> = {
  /** The Flummox! score, "07". */
  score: 2,
  /** The best score so far, "09", or "--". */
  best: 2,
  /** The question a game in progress carries on from, "05". */
  resume: 2,
  /** "+1 POINT" when an answer scored, blank when it was asked before. */
  point: 8,
  /** "NEW BEST!" when the game beat the best score, otherwise blank. */
  newbest: 9,
};

/** What an icon takes up on the grid: two cells of non-breaking space, so wrapping never splits or trims it. */
export const ICON_CELLS = '\u00a0\u00a0';

/** The middle third of a cell: a solid bar across the screen. */
export const RULE = sextant(0b001100);

const isColor = (name: string): name is TeletextColor => (TELETEXT_COLORS as readonly string[]).includes(name);

export const parseMarkup = (source: string): ParsedLine => {
  const segments: GridSegment[] = [];
  const links: number[] = [];
  const errors: string[] = [];
  const stack: Style[] = [];
  let fill: string | undefined;
  let fillColor: TeletextColor | undefined;
  let leaders = 0;

  const current = (): Style => stack[stack.length - 1] ?? {};

  const push = (text: string) => {
    if (!text) return;
    const { color, bg, link, answer } = current();
    const style: GridSegment = { text, color: color ?? 'white' };
    if (bg) style.bg = bg;
    if (link !== undefined) style.link = link;
    if (answer !== undefined) style.answer = answer;
    const last = segments[segments.length - 1];
    if (
      last &&
      !last.leader &&
      last.slot === undefined &&
      last.color === style.color &&
      last.bg === style.bg &&
      last.link === style.link &&
      last.answer === style.answer
    )
      last.text += text;
    else segments.push(style);
  };

  let i = 0;
  let text = '';
  while (i < source.length) {
    const ch = source[i];
    if (ch !== '{') {
      text += ch;
      i++;
      continue;
    }
    if (source[i + 1] === '{') {
      text += '{';
      i += 2;
      continue;
    }
    const end = source.indexOf('}', i);
    if (end === -1) {
      errors.push(`unclosed "{" at column ${i + 1}`);
      text += source.slice(i);
      break;
    }
    push(text);
    text = '';
    const tag = source.slice(i + 1, end);
    i = end + 1;

    if (tag === '/') {
      if (stack.length === 0) errors.push('"{/}" with nothing to close');
      else stack.pop();
    } else if (isColor(tag)) {
      stack.push({ ...current(), color: tag });
    } else if (tag.startsWith('bg:') && isColor(tag.slice(3))) {
      stack.push({ ...current(), bg: tag.slice(3) as TeletextColor });
    } else if (/^link:\d{3}$/.test(tag)) {
      const page = Number(tag.slice(5));
      links.push(page);
      stack.push({ ...current(), color: 'cyan', link: page });
    } else if (tag === 'dots') {
      leaders++;
      const { color, link } = current();
      segments.push({ text: '.', color: color ?? 'white', leader: true, ...(link !== undefined ? { link } : {}) });
    } else if (/^answer:[0-3]$/.test(tag)) {
      stack.push({ ...current(), answer: Number(tag.slice(7)) });
    } else if (tag.startsWith('slot:')) {
      const name = tag.slice(5);
      const width = SLOT_WIDTHS[name];
      if (width) {
        const { color, bg } = current();
        segments.push({ text: '\u00a0'.repeat(width), color: color ?? 'white', slot: name, ...(bg ? { bg } : {}) });
      } else errors.push(`unknown slot "${name}"; the slots are ${Object.keys(SLOT_WIDTHS).join(', ')}`);
    } else if (tag.startsWith('icon:')) {
      const name = tag.slice(5);
      if (name in ICONS) segments.push({ text: ICON_CELLS, icon: name as IconName });
      else errors.push(`unknown icon "${name}"; the icons are ${Object.keys(ICONS).join(', ')}`);
    } else if (tag === 'rule' || /^rule:.$/u.test(tag)) {
      fill = tag === 'rule' ? RULE : tag.slice(5);
      fillColor = current().color ?? 'white';
    } else {
      errors.push(`unknown tag "{${tag}}"`);
    }
  }
  push(text);

  if (leaders > 1) errors.push('only one "{dots}" fits on a line');
  if (stack.length > 0) errors.push(`${stack.length} tag(s) not closed with "{/}"`);
  if (fill !== undefined && segments.some((s) => s.text.trim() !== '')) {
    errors.push('"{rule}" must be the only thing on its line');
  }

  return fill === undefined ? { segments, links, errors } : { segments: [], fill, fillColor, links, errors };
};
