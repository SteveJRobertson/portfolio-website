import type { SemanticBlock, SemanticInline } from '../types/teletext.ts';
import { isBannerRow, isImageRow, type RowSource } from './schema.ts';
import { parseMarkup } from './markup.ts';

/**
 * Builds the semantic mirror (SPEC §9) from a sub-page's logical rows, before
 * any wrapping, so sentences are never cut at the screen width:
 *
 *   banner                   dropped (the page title is the <h1>)
 *   double-height text       kept, like any other row
 *   { "heading": true }      heading
 *   "* " rows                list
 *   rows starting {link:NNN} list of page links ("201 Isolate UI")
 *   label{dots}{link:NNN}    the same, with the number on the right
 *   indented row after one   continues that list item
 *   {rule}, blank rows       dropped
 *   { "screenOnly": true }   dropped
 *   { "image": … }           image, with its alt text, then any text beside it
 *   anything else            paragraph
 *
 * Email and web addresses in plain text become links.
 */
export const buildSemantic = (rows: RowSource[]): SemanticBlock[] => {
  const blocks: SemanticBlock[] = [];
  let list: SemanticInline[][] | null = null;

  const endList = () => {
    list = null;
  };
  const addItem = (item: SemanticInline[]) => {
    if (!list) {
      list = [];
      blocks.push({ kind: 'list', items: list });
    }
    list.push(item);
  };

  for (const source of rows) {
    if (isBannerRow(source)) {
      endList();
      continue;
    }
    if (isImageRow(source)) {
      endList();
      blocks.push({ kind: 'image', alt: source.alt }, ...buildSemantic(source.beside ?? []));
      continue;
    }
    const row = typeof source === 'string' ? { text: source } : source;
    if (row.screenOnly) {
      endList();
      continue;
    }
    const parsed = parseMarkup(row.text);
    const hasLeader = parsed.segments.some((s) => s.leader);
    const hasIcon = parsed.segments.some((s) => s.icon);
    parsed.segments = parsed.segments.filter((s) => !s.leader && !s.icon);
    const raw = parsed.segments.map((s) => s.text).join('');
    if (parsed.fill !== undefined || raw.trim() === '') {
      endList();
      continue;
    }

    const content = hasIcon ? trimStart(inlines(parsed.segments), /^\s+/) : inlines(parsed.segments);
    if (row.heading) {
      endList();
      blocks.push({ kind: 'heading', content });
    } else if (/^\s*[*-] /.test(raw)) {
      addItem(trimStart(content, /^\s*[*-] /));
    } else if (hasLeader && parsed.segments.at(-1)?.link !== undefined && /\d{3}\s*$/.test(raw)) {
      // "About me{dots}{link:101}101{/}": the same directory entry, with its number on the right
      const page = parsed.segments.at(-1)!.link!;
      const label = collapse(parsed.segments.slice(0, -1).map((s) => s.text).join('')).trim();
      addItem([{ text: `${page} ${label}`, page }]);
    } else if (/^\s*\d{3}\b/.test(raw) && parsed.segments.find((s) => s.text.trim())?.link !== undefined) {
      const page = parsed.segments.find((s) => s.text.trim())!.link!;
      addItem([{ text: collapse(raw).trim(), page }]);
    } else if (list && /^\s/.test(raw)) {
      const items: SemanticInline[][] = list;
      items[items.length - 1].push({ text: ': ' }, ...trimStart(content, /^\s+/));
    } else {
      endList();
      blocks.push({ kind: 'paragraph', content: trimStart(content, /^\s+/) });
    }
  }
  return blocks;
};

const collapse = (text: string) => text.replace(/\s+/g, ' ');

/** Merges segments into runs (page link or plain), collapsing the screen's alignment spaces. */
const inlines = (segments: { text: string; link?: number }[]): SemanticInline[] => {
  const runs: SemanticInline[] = [];
  for (const { text, link } of segments) {
    const last = runs[runs.length - 1];
    if (last && last.page === link) last.text += text;
    else runs.push(link === undefined ? { text } : { text, page: link });
  }
  return runs.flatMap((run) => (run.page === undefined ? autolink(collapse(run.text)) : [{ ...run, text: collapse(run.text) }]));
};

const trimStart = (content: SemanticInline[], pattern: RegExp): SemanticInline[] => {
  const [first, ...rest] = content;
  if (!first) return content;
  const text = first.text.replace(pattern, '');
  return text ? [{ ...first, text }, ...rest] : rest;
};

const ADDRESS = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+)|\b((?:[\w-]+\.)+(?:com|dev|org|net|io|uk)(?:\/[\w./-]*[\w/])?)/gi;

/** Splits plain text around email and web addresses, linking each address. */
export const autolink = (text: string): SemanticInline[] => {
  const out: SemanticInline[] = [];
  let at = 0;
  for (const match of text.matchAll(ADDRESS)) {
    if (match.index > at) out.push({ text: text.slice(at, match.index) });
    const [whole, email] = match;
    out.push({ text: whole, href: email ? `mailto:${email}` : `https://${whole}` });
    at = match.index + whole.length;
  }
  if (at < text.length) out.push({ text: text.slice(at) });
  return out;
};
