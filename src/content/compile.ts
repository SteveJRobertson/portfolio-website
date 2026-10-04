import type { CompiledPage, FastextLink, GridRow } from '../types/teletext.ts';
import {
  NARROW_BODY_ROWS,
  NARROW_COLS,
  WIDE_BODY_ROWS,
  WIDE_COLS,
  type FastextSource,
  type PageSource,
  type RowSource,
} from './schema.ts';
import { layoutRows, slotsUsed } from './wrap.ts';

export interface SourceFile {
  /** File name, e.g. `page110.json`. */
  file: string;
  data: unknown;
}

export interface CompileResult {
  pages: CompiledPage[];
  errors: string[];
}

const isRow = (row: unknown): row is RowSource =>
  typeof row === 'string' ||
  (typeof row === 'object' && row !== null && typeof (row as { text?: unknown }).text === 'string');

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
  if (page.index !== undefined && typeof page.index !== 'boolean') errors.push('"index" must be true or false');
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
  if (page.rows !== undefined && !isRowList(page.rows)) errors.push('"rows" must be a list of lines');
  if (page.subpages !== undefined && !isSubpageList(page.subpages)) errors.push('"subpages" must be a list of line lists');
  if (page.mobileRows !== undefined && !isRowList(page.mobileRows)) errors.push('"mobileRows" must be a list of lines');
  if (page.mobileSubpages !== undefined && !isSubpageList(page.mobileSubpages)) {
    errors.push('"mobileSubpages" must be a list of line lists');
  }
  return errors;
};

const subpagesOf = (rows?: RowSource[], subpages?: RowSource[][]): RowSource[][] | undefined =>
  subpages ?? (rows ? [rows] : undefined);

/**
 * Validates and lays out every page (SPEC §7). Fails on: rows too wide, too
 * many rows, Fastext or inline links to pages that don't exist, unknown or
 * unclosed tags, and file names that don't match their page.
 */
export const compilePages = (files: SourceFile[]): CompileResult => {
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
      const result = layoutRows(rows, width, wrap);
      errors.push(...result.errors.map((e) => `${where}: ${e}`));
      const used = slotsUsed(result.rows);
      if (used > limit) errors.push(`${where}: needs ${used} rows; the limit is ${limit}`);
      if (mode === 'wide') {
        for (const link of new Set(result.links)) {
          if (!exists(link)) errors.push(`${where}: links to page ${link}, which doesn't exist`);
        }
      }
      return result.rows;
    };

    const fastext = page.fastext.map((f, i): FastextLink => {
      if (!exists(f.page)) errors.push(`${file}: Fastext ${['red', 'green', 'yellow', 'cyan'][i]} points at page ${f.page}, which doesn't exist`);
      return { page: f.page, label: f.label ?? labels.get(f.page) ?? String(f.page) };
    }) as CompiledPage['fastext'];

    return {
      page: page.page,
      title: page.title,
      label: page.label,
      index: page.index ?? false,
      fastext,
      wide: subpages.map((rows, i) => layout(rows, i, 'wide', true)),
      narrow: subpages.map((rows, i) => (mobile?.[i] ? layout(mobile[i], i, 'narrow', false) : layout(rows, i, 'narrow', true))),
    };
  });

  return { pages: pages.sort((a, b) => a.page - b.page), errors };
};
