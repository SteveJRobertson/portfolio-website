import { THIN_LINE, type GridRow, type GridSegment, type TeletextColor } from '../types/teletext.ts';
import { blockBitmap, mixedBitmap, unsupportedChars, unsupportedMixedChars, type BlockWeight } from './blockFont.ts';
import { parseMarkup } from './markup.ts';
import { sextant } from './mosaic.ts';

/**
 * A page banner (SPEC §7): the title in mosaic block letters on a band of
 * colour, with a thin lip under it, as on Ceefax's section headers.
 *
 * On black it's a masthead, as on Teletext's: coloured letters in mixed case,
 * three rows tall and against the left margin, over a thin solid line in the
 * `rule` colour.
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
  /** Draws the lip in this colour instead of the band's: a thin rule under letters on black. */
  rule?: TeletextColor;
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
/** Rows of mosaic characters for one bitmap (three pixels a row), `cells` wide. */
const toCells = (bitmap: string[], cells: number): string[] => {
  const lit = (x: number, y: number) => bitmap[y]?.[x] === '#';
  const rows = Array.from({ length: bitmap.length / 3 }, () => '');
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < cells; c++) {
      let bits = 0;
      for (let p = 0; p < 6; p++) if (lit(2 * c + (p % 2), 3 * r + Math.floor(p / 2))) bits |= 1 << p;
      rows[r] += sextant(bits);
    }
  }
  return rows;
};

const lip = (bg: TeletextColor): GridRow => ({ segments: [{ text: ' ', color: bg }], fill: LIP });

const line = (color: TeletextColor): GridRow => ({ segments: [{ text: '', color }], fill: THIN_LINE });

const blockRows = (runs: Run[], bg: TeletextColor, width: number, weight: BlockWeight): GridRow[] | undefined => {
  const drawn = runs.map((run) => {
    const bitmap = bg === 'black' ? mixedBitmap(run.text, weight) : blockBitmap(run.text, weight);
    const cells = Math.ceil(bitmap[0].length / 2);
    return { ...run, cells, rows: toCells(bitmap, cells) };
  });
  const used = drawn.reduce((n, d) => n + d.cells, 0) + drawn.length - 1;
  // Bold letters keep a band cell clear at the right; condensed ones may run to the edge.
  const room = width - LEAD - (weight === 'bold' ? 1 : 0);
  if (used > room) return undefined;
  const before = bg === 'black' ? 0 : 2 + Math.floor((width - LEAD - used) / 2);
  const after = width - 1 - before - used;
  if (weight === 'bold' && after < 1) return undefined;

  return drawn[0].rows.map((_, r): GridRow => {
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
  const unknown = (source.bg === 'black' ? unsupportedMixedChars : unsupportedChars)(runs.map((r) => r.text).join(''));
  if (unknown.length) errors.push(`the banner font has no ${unknown.map((c) => `"${c}"`).join(', ')}`);
  if (errors.length) return { rows: [], errors };

  const under = source.bg === 'black' ? line(source.rule ?? runs[0].color) : lip(source.rule ?? source.bg);
  const block = blockRows(runs, source.bg, width, 'bold') ?? blockRows(runs, source.bg, width, 'condensed');
  if (block) return { rows: [...block, under], errors };
  const text = textRow(runs, source.bg, width);
  if (text) return { rows: [text, under], errors };
  return { rows: [], errors: [`banner "${runs.map((r) => r.text).join(' ')}" is too long for ${width} columns`] };
};
