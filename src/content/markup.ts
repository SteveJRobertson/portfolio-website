import { TELETEXT_COLORS, type GridSegment, type TeletextColor } from '../types/teletext.ts';

/**
 * Colour-tag markup for one logical line (SPEC §7):
 *
 *   {cyan}TEXT{/}        foreground colour
 *   {bg:blue}TEXT{/}     background colour
 *   {link:201}TEXT{/}    inline page link (cyan unless a colour is set inside it)
 *   {rule} / {rule:-}    a full-width rule; the only thing on its row, colour from the enclosing tag
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
}

const isColor = (name: string): name is TeletextColor => (TELETEXT_COLORS as readonly string[]).includes(name);

export const parseMarkup = (source: string): ParsedLine => {
  const segments: GridSegment[] = [];
  const links: number[] = [];
  const errors: string[] = [];
  const stack: Style[] = [];
  let fill: string | undefined;
  let fillColor: TeletextColor | undefined;

  const current = (): Style => stack[stack.length - 1] ?? {};

  const push = (text: string) => {
    if (!text) return;
    const { color, bg, link } = current();
    const style: GridSegment = { text, color: color ?? 'white' };
    if (bg) style.bg = bg;
    if (link !== undefined) style.link = link;
    const last = segments[segments.length - 1];
    if (last && last.color === style.color && last.bg === style.bg && last.link === style.link) last.text += text;
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
    } else if (tag === 'rule' || /^rule:.$/u.test(tag)) {
      fill = tag === 'rule' ? '=' : tag.slice(5);
      fillColor = current().color ?? 'white';
    } else {
      errors.push(`unknown tag "{${tag}}"`);
    }
  }
  push(text);

  if (stack.length > 0) errors.push(`${stack.length} tag(s) not closed with "{/}"`);
  if (fill !== undefined && segments.some((s) => s.text.trim() !== '')) {
    errors.push('"{rule}" must be the only thing on its line');
  }

  return fill === undefined ? { segments, links, errors } : { segments: [], fill, fillColor, links, errors };
};
