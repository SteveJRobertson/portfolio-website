import type { GridRow, GridSegment, TeletextColor } from '../types/teletext.ts';
import { BLOCK_HEIGHT, blockBitmap, unsupportedChars, type BlockWeight } from './blockFont.ts';
import { parseMarkup } from './markup.ts';
import { sextant } from './mosaic.ts';

/**
 * A page banner (SPEC §7): the title in mosaic block letters on a band of
 * colour, with a thin lip under it, as on Ceefax's section headers.
 *
 * As on a real set, the band starts one cell in (the colour change takes a
 * cell) and the letters two cells after that. Each colour run in the markup
 * is drawn in its own colour; a space between runs is the one-cell gap a
 * colour change costs. Bold letters are tried first, then condensed; if
 * neither fits, the title is set in double-height text on the band instead.
 */

export interface BannerSource {
  banner: string;
  bg: TeletextColor;
}

interface Run {
  text: string;
  color: TeletextColor;
}

/** Cells before the letters: the black edge cell, then two band cells. */
const LEAD = 3;

/** Top third of a cell: the lip under the band. */
const LIP = sextant(0b000011);

const band = (bg: TeletextColor, text: string, color: TeletextColor = 'white'): GridSegment => ({ text, color, bg, mosaic: true });

const runsOf = (segments: GridSegment[]): Run[] => {
  const runs: Run[] = [];
  for (const { text, color = 'white' } of segments) {
    if (!text.trim()) continue;
    runs.push({ text: text.trim(), color });
  }
  return runs;
};

/** Two rows of mosaic characters for one bitmap, `cells` wide. */
const toCells = (bitmap: string[], cells: number): [string, string] => {
  const lit = (x: number, y: number) => bitmap[y]?.[x] === '#';
  const rows: [string, string] = ['', ''];
  for (let r = 0; r < BLOCK_HEIGHT / 3; r++) {
    for (let c = 0; c < cells; c++) {
      let bits = 0;
      for (let p = 0; p < 6; p++) if (lit(2 * c + (p % 2), 3 * r + Math.floor(p / 2))) bits |= 1 << p;
      rows[r] += sextant(bits);
    }
  }
  return rows;
};

const lip = (bg: TeletextColor): GridRow => ({ segments: [{ text: ' ', color: bg }], fill: LIP });

const blockRows = (runs: Run[], bg: TeletextColor, width: number, weight: BlockWeight): GridRow[] | undefined => {
  const drawn = runs.map((run) => {
    const bitmap = blockBitmap(run.text, weight);
    const cells = Math.ceil(bitmap[0].length / 2);
    return { ...run, cells, rows: toCells(bitmap, cells) };
  });
  const used = drawn.reduce((n, d) => n + d.cells, 0) + drawn.length - 1;
  // Bold letters keep a band cell clear at the right; condensed ones may run to the edge.
  const room = width - LEAD - (weight === 'bold' ? 1 : 0);
  if (used > room) return undefined;
  const before = 2 + Math.floor((width - LEAD - used) / 2);
  const after = width - 1 - before - used;
  if (weight === 'bold' && after < 1) return undefined;

  return [0, 1].map((r): GridRow => {
    const segments: GridSegment[] = [{ text: ' ' }, band(bg, ' '.repeat(before))];
    drawn.forEach((d, i) => {
      if (i > 0) segments.push(band(bg, ' '));
      segments.push(band(bg, d.rows[r], d.color));
    });
    if (after > 0) segments.push(band(bg, ' '.repeat(after)));
    return { segments, fillBg: bg };
  });
};

const textRow = (runs: Run[], bg: TeletextColor, width: number): GridRow | undefined => {
  const used = runs.reduce((n, r) => n + Array.from(r.text).length, 0) + runs.length - 1;
  if (LEAD + used > width) return undefined;
  const segments: GridSegment[] = [{ text: ' ' }, band(bg, '  ')];
  runs.forEach((run, i) => {
    if (i > 0) segments.push(band(bg, ' '));
    segments.push(band(bg, run.text, run.color));
  });
  const after = width - LEAD - used;
  if (after > 0) segments.push(band(bg, ' '.repeat(after)));
  return { segments, doubleHeight: true, fillBg: bg };
};

export const layoutBanner = (source: BannerSource, width: number): { rows: GridRow[]; errors: string[] } => {
  const parsed = parseMarkup(source.banner);
  const errors = [...parsed.errors];
  if (parsed.links.length || parsed.fill !== undefined || parsed.segments.some((s) => s.bg)) {
    errors.push('a banner takes only colour tags');
  }
  const runs = runsOf(parsed.segments);
  if (!runs.length) errors.push('a banner needs some text');
  const unknown = unsupportedChars(runs.map((r) => r.text).join(''));
  if (unknown.length) errors.push(`the banner font has no ${unknown.map((c) => `"${c}"`).join(', ')}`);
  if (errors.length) return { rows: [], errors };

  const block = blockRows(runs, source.bg, width, 'bold') ?? blockRows(runs, source.bg, width, 'condensed');
  if (block) return { rows: [...block, lip(source.bg)], errors };
  const text = textRow(runs, source.bg, width);
  if (text) return { rows: [text, lip(source.bg)], errors };
  return { rows: [], errors: [`banner "${runs.map((r) => r.text).join(' ')}" is too long for ${width} columns`] };
};
