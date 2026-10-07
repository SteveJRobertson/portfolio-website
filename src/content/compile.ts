import { TELETEXT_COLORS, type CompiledPage, type FastextLink, type GridRow, type TeletextColor } from '../types/teletext.ts';
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
import { layoutRows, slotsUsed, type ImageRenderer } from './wrap.ts';
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
const imageRenderer =
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
      return subpages.length > 1 ? withHint(result.rows, width, limit, where) : result.rows;
    };

    // Pages with sub-pages say how to step through them, always in the last body row, just above Fastext.
    const hint = page.hint ?? DEFAULT_HINT;
    const withHint = (rows: GridRow[], width: number, limit: number, where: string): GridRow[] => {
      const used = slotsUsed(rows);
      if (used > limit - 2) {
        if (used <= limit) errors.push(`${where}: needs ${used} rows; the limit is ${limit - 2}, leaving a blank row and the ← → hint`);
        return rows;
      }
      const laid = layoutRows([hint], width);
      errors.push(...laid.errors.map((e) => `${where}: hint: ${e}`));
      if (laid.rows.length > 1) errors.push(`${where}: the hint "${hint}" must fit on one line`);
      return [...rows, ...Array.from({ length: limit - 1 - used }, () => ({ segments: [] })), laid.rows[0]];
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
      semantic: subpages.map(buildSemantic),
    };
  });

  return { pages: pages.sort((a, b) => a.page - b.page), errors };
};
