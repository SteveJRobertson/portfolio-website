import {
  TELETEXT_COLORS,
  type CompiledPage,
  type FastextLink,
  type GridRow,
  type SemanticBlock,
  type TeletextColor,
} from '../types/teletext.ts';
import {
  BANNER_KEYS,
  IMAGE_KEYS,
  ROW_KEYS,
  NARROW_BODY_ROWS,
  NARROW_COLS,
  WIDE_BODY_ROWS,
  WIDE_COLS,
  type FastextSource,
  type ImageRowSource,
  type PageSource,
  type RowSource,
} from './schema.ts';
import { MARGIN, layoutRows, slotsUsed, type ImageRenderer } from './wrap.ts';
import { parseMarkup } from './markup.ts';
import { mosaicCols, mosaicRowsFor, overfullCells, toMosaic, type RgbaImage } from './mosaic.ts';
import { buildSemantic } from './semantic.ts';

export interface SourceFile {
  /** File name, e.g. `page110.json`. */
  file: string;
  data: unknown;
}

export interface CompileResult {
  pages: CompiledPage[];
  errors: string[];
}

/** The sub-page hint when a page doesn't set its own. */
export const DEFAULT_HINT = '{white}Press ← or → for more.{/}';

const BOOLEAN_KEYS = ROW_KEYS.filter((k) => k !== 'text');

const isCount = (v: unknown) => Number.isInteger(v) && (v as number) > 0;
const isFactor = (v: unknown) => v === undefined || (typeof v === 'number' && v > 0);

const isImageSource = (fields: Record<string, unknown>): boolean =>
  typeof fields.image === 'string' &&
  typeof fields.alt === 'string' &&
  isCount(fields.rows) &&
  (fields.mobileRows === undefined || isCount(fields.mobileRows)) &&
  (fields.palette === undefined ||
    (Array.isArray(fields.palette) && fields.palette.every((c) => TELETEXT_COLORS.includes(c as TeletextColor)))) &&
  isFactor(fields.contrast) &&
  isFactor(fields.saturation) &&
  isFactor(fields.brightness) &&
  (fields.pixelArt === undefined || typeof fields.pixelArt === 'boolean') &&
  (fields.align === undefined || fields.align === 'right') &&
  (fields.beside === undefined || (Array.isArray(fields.beside) && fields.beside.every((r) => isRow(r) && !(typeof r === 'object' && ('image' in r || 'banner' in r))))) &&
  Object.keys(fields).every((k) => (IMAGE_KEYS as readonly string[]).includes(k));

const isRow = (row: unknown): row is RowSource => {
  if (typeof row === 'string') return true;
  if (typeof row !== 'object' || row === null) return false;
  const fields = row as Record<string, unknown>;
  if ('image' in fields) return isImageSource(fields);
  if ('banner' in fields) {
    return (
      typeof fields.banner === 'string' &&
      TELETEXT_COLORS.includes(fields.bg as TeletextColor) &&
      (fields.rule === undefined || TELETEXT_COLORS.includes(fields.rule as TeletextColor)) &&
      Object.keys(fields).every((k) => (BANNER_KEYS as readonly string[]).includes(k))
    );
  }
  return (
    typeof fields.text === 'string' &&
    Object.keys(fields).every((k) => (ROW_KEYS as readonly string[]).includes(k)) &&
    BOOLEAN_KEYS.every((k) => fields[k] === undefined || typeof fields[k] === 'boolean')
  );
};

const isRowList = (rows: unknown): rows is RowSource[] => Array.isArray(rows) && rows.every(isRow);

const isSubpageList = (subpages: unknown): subpages is RowSource[][] =>
  Array.isArray(subpages) && subpages.length > 0 && subpages.every(isRowList);

/** Checks the JSON shape, returning the problems found. */
const shapeErrors = (data: unknown): string[] => {
  if (typeof data !== 'object' || data === null) return ['is not a JSON object'];
  const page = data as Record<string, unknown>;
  const errors: string[] = [];
  if (!Number.isInteger(page.page)) errors.push('"page" must be a whole number');
  if (typeof page.title !== 'string' || !page.title) errors.push('"title" is required');
  if (typeof page.label !== 'string' || !page.label) errors.push('"label" is required');
  if (page.description !== undefined && (typeof page.description !== 'string' || !page.description)) {
    errors.push('"description" must be some text');
  }
  if (page.index !== undefined && typeof page.index !== 'boolean') errors.push('"index" must be true or false');
  if (page.hint !== undefined && (typeof page.hint !== 'string' || !page.hint)) errors.push('"hint" must be some text');
  if (page.hint !== undefined && !Array.isArray(page.subpages)) errors.push('"hint" is only for pages with "subpages"');
  const promo = page.promo as { text?: unknown; page?: unknown } | undefined;
  if (promo !== undefined && (typeof promo !== 'object' || promo === null || typeof promo.text !== 'string' || !promo.text || !Number.isInteger(promo.page))) {
    errors.push('"promo" must be { "text": "…", "page": NNN }');
  }
  if (promo !== undefined && page.subpages !== undefined) errors.push('"promo" is only for pages without "subpages"');
  const fastext = page.fastext;
  if (
    !Array.isArray(fastext) ||
    fastext.length !== 4 ||
    !fastext.every((f) => typeof f === 'object' && f !== null && Number.isInteger((f as FastextSource).page))
  ) {
    errors.push('"fastext" must list four { "page": NNN } entries (red, green, yellow, cyan)');
  }
  if ((page.rows === undefined) === (page.subpages === undefined)) {
    errors.push('needs exactly one of "rows" or "subpages"');
  }
  const lineHelp = `a line object may only have ${ROW_KEYS.join(', ')}; an image needs image, alt and rows, and may have ${IMAGE_KEYS.slice(3).join(', ')}; a banner needs banner and bg, and may have rule`;
  if (page.rows !== undefined && !isRowList(page.rows)) errors.push(`"rows" must be a list of lines (${lineHelp})`);
  if (page.subpages !== undefined && !isSubpageList(page.subpages)) errors.push(`"subpages" must be a list of line lists (${lineHelp})`);
  if (page.mobileRows !== undefined && !isRowList(page.mobileRows)) errors.push('"mobileRows" must be a list of lines');
  if (page.mobileSubpages !== undefined && !isSubpageList(page.mobileSubpages)) {
    errors.push('"mobileSubpages" must be a list of line lists');
  }
  return errors;
};

const subpagesOf = (rows?: RowSource[], subpages?: RowSource[][]): RowSource[][] | undefined =>
  subpages ?? (rows ? [rows] : undefined);

/**
 * Converts image rows to mosaic cells. Wide layouts use the row's `rows`;
 * portrait fits the picture to the width unless `mobileRows` says otherwise.
 * Pixel art is used as drawn, so its size is fixed by the PNG.
 */
export const imageRenderer =
  (images: Readonly<Record<string, RgbaImage>>): ImageRenderer =>
  (source: ImageRowSource, width: number) => {
    const fail = (error: string) => ({ rows: [], cols: 0, errors: [error] });
    const picture = images[source.image];
    if (!picture) return fail(`image "${source.image}" isn't in src/content/images (expected ${source.image}.png)`);
    if (!source.alt.trim()) return fail(`image "${source.image}" needs "alt" text`);

    if (source.pixelArt) {
      if (picture.width % 2 || picture.height % 3) {
        return fail(`pixel art "${source.image}" is ${picture.width} × ${picture.height}; it must be 2 pixels a column and 3 a row`);
      }
      const rows = picture.height / 3;
      const cols = picture.width / 2;
      if (source.rows !== rows) return fail(`pixel art "${source.image}" is ${rows} rows tall, so "rows" must be ${rows}`);
      if (cols > width) return fail(`image "${source.image}" is ${cols} cells wide; the limit is ${width}`);
      const overfull = overfullCells(picture);
      if (overfull.length) {
        return fail(`pixel art "${source.image}" uses more than two colours in cell(s) ${overfull.join('; ')} (column,row); a cell can show two`);
      }
      return { rows: toMosaic(picture, { rows, cols }), cols, errors: [] };
    }

    const narrow = width < WIDE_COLS;
    const rows = narrow ? (source.mobileRows ?? Math.min(source.rows, mosaicRowsFor(picture, width))) : source.rows;
    const cols = mosaicCols(picture, rows);
    if (cols > width) return fail(`image "${source.image}" is ${cols} cells wide at ${rows} rows; the limit is ${width}`);
    return { rows: toMosaic(picture, { ...source, rows }), cols, errors: [] };
  };

/**
 * Puts a one-line hint ("Press ← or → for more.") in the last body row, just
 * above Fastext, with at least one blank row between it and the page.
 */
export const pinHint = (
  rows: GridRow[],
  hint: string,
  width: number,
  limit: number,
  name = 'hint',
  gap = true,
): { rows: GridRow[]; errors: string[] } => {
  const used = slotsUsed(rows);
  const room = limit - (gap ? 2 : 1);
  if (used > room) {
    const errors = used <= limit ? [`needs ${used} rows; the limit is ${room}, leaving ${gap ? 'a blank row and ' : ''}the ${name}`] : [];
    return { rows, errors };
  }
  const laid = layoutRows([hint], width);
  const errors = laid.errors.map((e) => `hint: ${e}`);
  if (laid.rows.length > 1) errors.push(`the hint "${hint}" must fit on one line`);
  return { rows: [...rows, ...Array.from({ length: limit - 1 - used }, () => ({ segments: [] })), laid.rows[0]], errors };
};

/** A hint for each width, and whether it needs a blank row above it (the default). */
export interface ScreenHint {
  wide: string;
  narrow: string;
  gap?: boolean;
}

/** One screen laid out for both widths, with its semantic mirror. */
export interface CompiledScreen {
  wide: GridRow[];
  narrow: GridRow[];
  semantic: SemanticBlock[];
}

/**
 * Lays out one screen that isn't a page of its own (a Flummox! screen) the way
 * pages are laid out: wrapped at 38 and 32 columns, checked against the grid,
 * with an optional hint pinned to the last body row. `narrowRows` can lay
 * portrait out differently (the mirror always comes from `rows`). `where` names it in errors.
 */
export const compileScreen = (
  rows: RowSource[],
  where: string,
  renderImage: ImageRenderer,
  hint?: string | ScreenHint,
  narrowRows: RowSource[] = rows,
): CompiledScreen & { errors: string[]; links: number[] } => {
  const errors: string[] = [];
  const links: number[] = [];
  const layout = (mode: 'wide' | 'narrow'): GridRow[] => {
    const width = mode === 'wide' ? WIDE_COLS : NARROW_COLS;
    const limit = mode === 'wide' ? WIDE_BODY_ROWS : NARROW_BODY_ROWS;
    const at = `${where} (${mode === 'wide' ? `${width} columns` : 'portrait'})`;
    const result = layoutRows(mode === 'wide' ? rows : narrowRows, width, true, renderImage);
    errors.push(...result.errors.map((e) => `${at}: ${e}`));
    if (mode === 'wide') links.push(...result.links);
    const used = slotsUsed(result.rows);
    if (used > limit) errors.push(`${at}: needs ${used} rows; the limit is ${limit}`);
    if (hint === undefined) return result.rows;
    const text = typeof hint === 'string' ? hint : hint[mode];
    const pinned = pinHint(result.rows, text, width, limit, 'hint', typeof hint === 'string' || hint.gap !== false);
    errors.push(...pinned.errors.map((e) => `${at}: ${e}`));
    return pinned.rows;
  };
  return { wide: layout('wide'), narrow: layout('narrow'), semantic: buildSemantic(rows), errors, links };
};

/**
 * Validates and lays out every page (SPEC §7). Fails on: rows too wide, too
 * many rows, Fastext or inline links to pages that don't exist, unknown or
 * unclosed tags, file names that don't match their page, and images that are
 * missing, too big or have no alt text. `images` holds the decoded pictures
 * in `src/content/images`, by name.
 */
export const compilePages = (files: SourceFile[], images: Readonly<Record<string, RgbaImage>> = {}): CompileResult => {
  const renderImage = imageRenderer(images);
  const errors: string[] = [];
  const sources: { file: string; page: PageSource }[] = [];
  const seen = new Map<number, string>();

  for (const { file, data } of files) {
    const problems = shapeErrors(data);
    if (problems.length) {
      errors.push(...problems.map((p) => `${file}: ${p}`));
      continue;
    }
    const page = data as PageSource;
    if (file !== `page${page.page}.json`) errors.push(`${file}: holds page ${page.page}, so it should be page${page.page}.json`);
    const other = seen.get(page.page);
    if (other) errors.push(`${file}: page ${page.page} is also defined in ${other}`);
    seen.set(page.page, file);
    sources.push({ file, page });
  }

  const labels = new Map(sources.map(({ page }) => [page.page, page.label]));
  const exists = (n: number) => labels.has(n);

  const pages = sources.map(({ file, page }): CompiledPage => {
    const subpages = subpagesOf(page.rows, page.subpages)!;
    const mobile = subpagesOf(page.mobileRows, page.mobileSubpages);
    if (mobile && mobile.length !== subpages.length) {
      errors.push(`${file}: has ${subpages.length} sub-page(s) but ${mobile.length} mobile override(s)`);
    }

    const layout = (rows: RowSource[], i: number, mode: 'wide' | 'narrow', wrap: boolean): GridRow[] => {
      const width = mode === 'wide' ? WIDE_COLS : NARROW_COLS;
      const limit = mode === 'wide' ? WIDE_BODY_ROWS : NARROW_BODY_ROWS;
      const where = `${file}${subpages.length > 1 ? ` sub-page ${i + 1}` : ''} (${mode === 'wide' ? `${width} columns` : 'portrait'})`;
      const result = layoutRows(rows, width, wrap, renderImage);
      errors.push(...result.errors.map((e) => `${where}: ${e}`));
      const used = slotsUsed(result.rows);
      if (used > limit) errors.push(`${where}: needs ${used} rows; the limit is ${limit}`);
      if (mode === 'wide') {
        for (const link of new Set(result.links)) {
          if (!exists(link)) errors.push(`${where}: links to page ${link}, which doesn't exist`);
        }
      }
      if (page.promo) return withPromo(result.rows, page.promo, width, limit, where);
      return subpages.length > 1 ? withHint(result.rows, width, limit, where) : result.rows;
    };

    // The promo bar takes the last two body rows, just above Fastext, with a blank row above it.
    const withPromo = (rows: GridRow[], promo: NonNullable<PageSource['promo']>, width: number, limit: number, where: string): GridRow[] => {
      if (!exists(promo.page)) errors.push(`${where}: the promo links to page ${promo.page}, which doesn't exist`);
      const used = slotsUsed(rows);
      if (used > limit - 3) errors.push(`${where}: needs ${used} rows; the limit is ${limit - 3} with the promo`);
      // Padded with no-break spaces so the red runs edge to edge (plain trailing spaces are trimmed)
      const inner = width - MARGIN;
      const length = Array.from(promo.text.replace(/\{[^}]*\}/g, '')).length;
      const left = Math.max(0, Math.floor((inner - length) / 2));
      const pad = (n: number) => '\u00a0'.repeat(Math.max(0, n));
      const bar = layoutRows([{ text: `{link:${promo.page}}{bg:red}${pad(left)}${promo.text}${pad(inner - left - length)}{/}{/}`, doubleHeight: true }], width);
      errors.push(...bar.errors.map((e) => `${where}: promo: ${e}`));
      if (bar.rows.length > 1) errors.push(`${where}: the promo "${promo.text}" must fit on one line`);
      return [...rows, ...Array.from({ length: Math.max(0, limit - 2 - used) }, () => ({ segments: [] })), bar.rows[0]];
    };

    // Pages with sub-pages say how to step through them, always in the last body row, just above Fastext.
    const hint = page.hint ?? DEFAULT_HINT;
    const withHint = (rows: GridRow[], width: number, limit: number, where: string): GridRow[] => {
      const pinned = pinHint(rows, hint, width, limit, '← → hint');
      errors.push(...pinned.errors.map((e) => `${where}: ${e}`));
      return pinned.rows;
    };

    const fastext = page.fastext.map((f, i): FastextLink => {
      if (!exists(f.page)) errors.push(`${file}: Fastext ${['red', 'green', 'yellow', 'cyan'][i]} points at page ${f.page}, which doesn't exist`);
      return { page: f.page, label: f.label ?? labels.get(f.page) ?? String(f.page) };
    }) as CompiledPage['fastext'];

    return {
      page: page.page,
      title: page.title,
      ...(page.description ? { description: page.description } : {}),
      label: page.label,
      index: page.index ?? false,
      fastext,
      wide: subpages.map((rows, i) => layout(rows, i, 'wide', true)),
      narrow: subpages.map((rows, i) => (mobile?.[i] ? layout(mobile[i], i, 'narrow', false) : layout(rows, i, 'narrow', true))),
      semantic: subpages.map((rows) => {
        const blocks = buildSemantic(rows);
        if (!page.promo) return blocks;
        const text = parseMarkup(page.promo.text).segments.map((s) => s.text).join('');
        return [...blocks, { kind: 'paragraph' as const, content: [{ text, page: page.promo.page }] }];
      }),
    };
  });

  return { pages: pages.sort((a, b) => a.page - b.page), errors };
};
