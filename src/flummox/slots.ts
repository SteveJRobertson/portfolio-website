import type { GridRow, SemanticBlock, SemanticInline } from '../types/teletext';

/** Values for a screen's `{slot:NAME}` spaces; a slot left out stays blank. */
export type SlotValues = Partial<Record<string, string>>;

/** Two digits, as the Teletext screens show numbers: 7 is "07". */
export const twoDigits = (n: number): string => String(n).padStart(2, '0');

/**
 * Fills a laid-out screen's slots. Each keeps the width it was laid out with,
 * so a value is padded with spaces or cut to fit and nothing else moves.
 */
export const fillSlots = (rows: GridRow[], values: SlotValues): GridRow[] =>
  rows.map((row) =>
    row.segments.some((s) => s.slot !== undefined)
      ? {
          ...row,
          segments: row.segments.map((s) => {
            if (s.slot === undefined) return s;
            const width = Array.from(s.text).length;
            return { ...s, text: Array.from((values[s.slot] ?? '').padEnd(width, ' ')).slice(0, width).join('') };
          }),
        }
      : row,
  );

const fillInlines = (content: SemanticInline[], values: SlotValues): SemanticInline[] =>
  content.flatMap((run) => {
    if (run.slot === undefined) return [run];
    const text = values[run.slot]?.trim();
    return text ? [{ text }] : [];
  });

/** The same for the semantic mirror, where a blank slot is left out. */
export const fillSemanticSlots = (blocks: SemanticBlock[], values: SlotValues): SemanticBlock[] =>
  blocks.flatMap((block): SemanticBlock[] => {
    if (block.kind === 'heading' || block.kind === 'paragraph') {
      const content = fillInlines(block.content, values);
      return content.some((run) => run.text.trim()) ? [{ ...block, content }] : [];
    }
    if (block.kind === 'list') return [{ ...block, items: block.items.map((item) => fillInlines(item, values)) }];
    return [block];
  });
