import type { CompiledPage, SemanticBlock } from '../types/teletext.ts';

/** The browser tab title, set by the app on every page change and written into each pre-rendered page. */
export const documentTitle = (page: number, title: string): string => `P${page} ${title} | Steve Robertson`;

const DESCRIPTION_LENGTH = 160;

const blockText = (block: SemanticBlock): string =>
  block.kind === 'paragraph' || block.kind === 'heading'
    ? block.content.map((run) => run.text).join('')
    : block.kind === 'list'
      ? block.items.map((item) => item.map((run) => run.text).join('')).join('; ')
      : '';

/**
 * The page's description for search results and link previews: its own
 * `description`, or its first paragraphs cut at a word near 160 characters.
 */
export const pageDescription = (page: CompiledPage): string => {
  if (page.description) return page.description;
  const paragraphs = page.semantic
    .flat()
    .filter((b) => b.kind === 'paragraph')
    .map(blockText)
    .map((t) => t.trim())
    .filter(Boolean);
  const text = (paragraphs.length ? paragraphs : page.semantic.flat().map(blockText)).join(' ').replace(/\s+/g, ' ').trim();
  if (text.length <= DESCRIPTION_LENGTH) return text || page.title;
  const cut = text.slice(0, DESCRIPTION_LENGTH - 1);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
};
