import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseMarkup } from './markup';
import { layoutRows, slotsUsed } from './wrap';
import { compilePages, type SourceFile } from './compile';
import { autolink, buildSemantic } from './semantic';
import { NARROW_BODY_ROWS, WIDE_BODY_ROWS, type PageSource } from './schema';
import { NAVIGABLE_PAGES, PAGES, QUICK_INDEX, getPage, isValidPage } from './registry';
import { sidebarRows } from '../display/sidebar';
import { rowLength, rowText } from '../display/rows';
import type { GridRow } from '../types/teletext';

const texts = (rows: GridRow[]) => rows.map(rowText);

describe('parseMarkup', () => {
  it('colours text and defaults to white', () => {
    expect(parseMarkup('A {cyan}B{/} C').segments).toEqual([
      { text: 'A ', color: 'white' },
      { text: 'B', color: 'cyan' },
      { text: ' C', color: 'white' },
    ]);
  });

  it('nests tags and closes the most recent one', () => {
    expect(parseMarkup('{yellow}A{bg:blue}B{/}C{/}').segments).toEqual([
      { text: 'A', color: 'yellow' },
      { text: 'B', color: 'yellow', bg: 'blue' },
      { text: 'C', color: 'yellow' },
    ]);
  });

  it('marks inline links in cyan and records their targets', () => {
    const parsed = parseMarkup('See {link:110}110{/}.');
    expect(parsed.segments[1]).toEqual({ text: '110', color: 'cyan', link: 110 });
    expect(parsed.links).toEqual([110]);
  });

  it('reads {rule} and {rule:X} with the enclosing colour', () => {
    expect(parseMarkup('{blue}{rule}{/}')).toMatchObject({ fill: '=', fillColor: 'blue', segments: [] });
    expect(parseMarkup('{rule:-}')).toMatchObject({ fill: '-', fillColor: 'white' });
  });

  it('turns {{ into a literal brace', () => {
    expect(parseMarkup('{{x}').segments).toEqual([{ text: '{x}', color: 'white' }]);
  });

  it.each([
    ['{orange}X{/}', 'unknown tag "{orange}"'],
    ['{cyan}X', 'not closed'],
    ['X{/}', 'nothing to close'],
    ['{cyan', 'unclosed "{"'],
    ['{link:12}X{/}', 'unknown tag'],
    ['TEXT {rule}', 'only thing on its line'],
  ])('reports %s', (source, message) => {
    expect(parseMarkup(source).errors.join()).toContain(message);
  });
});

describe('layoutRows', () => {
  it('adds a one-cell margin and wraps at word boundaries', () => {
    expect(texts(layoutRows(['one two three four'], 12).rows)).toEqual([' one two', ' three four']);
  });

  it('keeps colours across a break', () => {
    const [first, second] = layoutRows(['{cyan}alpha beta{/} go'], 10).rows;
    expect(first.segments.at(-1)).toEqual({ text: 'alpha', color: 'cyan' });
    expect(second.segments).toEqual([{ text: ' ' }, { text: 'beta', color: 'cyan' }, { text: ' go', color: 'white' }]);
  });

  it('hangs bullets and page numbers', () => {
    expect(texts(layoutRows(['* aaa bbb ccc', '201  ddd eee fff'], 12).rows)).toEqual([
      ' * aaa bbb',
      '   ccc',
      ' 201  ddd',
      '      eee',
      '      fff',
    ]);
  });

  it('keeps leading spaces as an indent on every line', () => {
    expect(texts(layoutRows(['   aaa bbb ccc'], 12).rows)).toEqual(['    aaa bbb', '    ccc']);
  });

  it('breaks URLs and emails after / - and @', () => {
    expect(texts(layoutRows(['github.com/SteveJRobertson', 'steve.robertson80@gmail.com'], 20).rows)).toEqual([
      ' github.com/',
      ' SteveJRobertson',
      ' steve.robertson80@',
      ' gmail.com',
    ]);
  });

  it('hard-splits words longer than a line', () => {
    expect(texts(layoutRows(['ABCDEFGHIJKLMNOP'], 8).rows)).toEqual([' ABCDEFG', ' HIJKLMN', ' OP']);
  });

  it('wraps double-height rows and counts two slots per line', () => {
    const { rows } = layoutRows([{ text: 'BIG TITLE HERE', doubleHeight: true }, 'small'], 12);
    expect(rows.map((r) => [rowText(r), r.doubleHeight ?? false])).toEqual([
      [' BIG TITLE', true],
      [' HERE', true],
      [' small', false],
    ]);
    expect(slotsUsed(rows)).toBe(5);
  });

  it('keeps blank lines and rules', () => {
    const { rows } = layoutRows(['', '{blue}{rule:-}{/}'], 10);
    expect(rows).toEqual([{ segments: [] }, { segments: [{ text: '', color: 'blue' }], fill: '-' }]);
  });

  it('counts a mosaic character as one cell', () => {
    const mosaic = String.fromCodePoint(0x1fb00).repeat(9);
    expect(rowLength(layoutRows([mosaic], 10).rows[0])).toBe(10);
  });

  it('uses lines as written when wrapping is off, and reports long ones', () => {
    const { rows, errors } = layoutRows(['one two three four'], 12, false);
    expect(texts(rows)).toEqual([' one two three four']);
    expect(errors).toEqual(['line 1 is 19 cells wide; the limit is 12']);
  });
});

const source = (overrides: Partial<PageSource> = {}): PageSource => ({
  page: 100,
  title: 'Index',
  label: 'INDEX',
  fastext: [{ page: 100 }, { page: 100 }, { page: 100 }, { page: 100 }],
  rows: ['Hello'],
  ...overrides,
});

const file = (data: PageSource | object, name = `page${(data as PageSource).page}.json`): SourceFile => ({ file: name, data });

describe('compilePages', () => {
  it('lays out a page for both widths and resolves Fastext labels', () => {
    const { pages, errors } = compilePages([
      file(source({ fastext: [{ page: 101 }, { page: 101, label: 'ME' }, { page: 100 }, { page: 100 }] })),
      file(source({ page: 101, label: 'ABOUT' })),
    ]);
    expect(errors).toEqual([]);
    expect(pages[0].fastext.map((f) => f.label)).toEqual(['ABOUT', 'ME', 'INDEX', 'INDEX']);
    expect(texts(pages[0].wide[0])).toEqual([' Hello']);
    expect(texts(pages[0].narrow[0])).toEqual([' Hello']);
  });

  it('uses mobileRows as the portrait layout', () => {
    const { pages } = compilePages([file(source({ mobileRows: ['Hi'] }))]);
    expect(texts(pages[0].narrow[0])).toEqual([' Hi']);
    expect(texts(pages[0].wide[0])).toEqual([' Hello']);
  });

  it('compiles sub-pages', () => {
    const { pages, errors } = compilePages([file(source({ rows: undefined, subpages: [['One'], ['Two']] }))]);
    expect(errors).toEqual([]);
    expect(pages[0].wide.map(texts)).toEqual([[' One'], [' Two']]);
  });

  const errorsFor = (...files: SourceFile[]) => compilePages(files).errors.join('\n');

  it('rejects a page with too many rows for either layout', () => {
    expect(errorsFor(file(source({ rows: Array(WIDE_BODY_ROWS + 1).fill('x') })))).toContain(
      `page100.json (38 columns): needs ${WIDE_BODY_ROWS + 1} rows; the limit is ${WIDE_BODY_ROWS}`,
    );
    const long = 'word '.repeat(140); // 20 lines at 38 columns, 35 in portrait
    expect(errorsFor(file(source({ rows: [long] })))).toContain('(portrait): needs');
    expect(errorsFor(file(source({ mobileRows: Array(NARROW_BODY_ROWS + 1).fill('x') })))).toContain(
      `the limit is ${NARROW_BODY_ROWS}`,
    );
  });

  it('rejects a mobile row wider than 20 columns', () => {
    expect(errorsFor(file(source({ mobileRows: ['x'.repeat(20)] })))).toContain('is 21 cells wide; the limit is 20');
  });

  it('rejects links to pages that do not exist', () => {
    const errors = errorsFor(file(source({ fastext: [{ page: 999 }, { page: 100 }, { page: 100 }, { page: 100 }], rows: ['{link:555}X{/}'] })));
    expect(errors).toContain('Fastext red points at page 999');
    expect(errors).toContain('links to page 555');
  });

  it('reports tag errors with the file and line', () => {
    expect(errorsFor(file(source({ rows: ['ok', '{orange}X{/}'] })))).toContain('page100.json (38 columns): line 2: unknown tag "{orange}"');
  });

  it('rejects mismatched file names, duplicates and bad shapes', () => {
    expect(errorsFor(file(source(), 'page101.json'))).toContain('should be page100.json');
    expect(errorsFor(file(source()), file(source(), 'page100.json'))).toContain('also defined in');
    expect(errorsFor(file({ page: 100 }, 'page100.json'))).toContain('"title" is required');
    expect(errorsFor(file(source({ subpages: [['x']] })))).toContain('exactly one of "rows" or "subpages"');
    expect(errorsFor(file({ ...source(), rows: [{ text: 'x', bold: true }] }))).toContain('may only have text, doubleHeight, heading, screenOnly');
    expect(errorsFor(file({ ...source(), rows: [{ text: 'x', heading: 'yes' }] }))).toContain('"rows" must be a list of lines');
    expect(errorsFor(file(source({ rows: undefined, subpages: [['x']], mobileRows: ['a'], mobileSubpages: undefined }))
    )).toBe('');
    expect(errorsFor(file(source({ rows: undefined, subpages: [['x'], ['y']], mobileSubpages: [['a']] })))).toContain(
      '2 sub-page(s) but 1 mobile override(s)',
    );
  });
});

describe('real content', () => {
  const dir = path.join(__dirname, 'pages');
  const raw = fs.readdirSync(dir).map((name) => fs.readFileSync(path.join(dir, name), 'utf-8'));

  it('compiles every page with no errors', () => {
    const { errors } = compilePages(fs.readdirSync(dir).map((name, i) => ({ file: name, data: JSON.parse(raw[i]) })));
    expect(errors).toEqual([]);
  });

  it('fits every screen at both widths', () => {
    for (const page of PAGES) {
      page.wide.forEach((rows) => expect(slotsUsed(rows)).toBeLessThanOrEqual(WIDE_BODY_ROWS));
      page.narrow.forEach((rows) => expect(slotsUsed(rows)).toBeLessThanOrEqual(NARROW_BODY_ROWS));
      page.narrow.forEach((rows) => rows.forEach((r) => expect(r.fill || rowLength(r) <= 20).toBeTruthy()));
    }
  });

  it.each(['Antigravity', 'Storybook 8', 'Solutions Architect', 'over a decade', 'architecture consulting'])(
    'never says "%s" (CONTENT.md: copy to drop)',
    (phrase) => {
      raw.forEach((json) => expect(json.toLowerCase()).not.toContain(phrase.toLowerCase()));
    },
  );

  it('has the approved page map', () => {
    expect(PAGES.map((p) => p.page)).toEqual([100, 101, 110, 200, 201, 202, 203, 300, 400, 404, 888]);
    expect(getPage(110)?.wide).toHaveLength(6);
    expect(getPage(300)?.wide).toHaveLength(3);
  });
});

describe('registry', () => {
  it('treats 404 and unknown numbers as invalid targets', () => {
    expect(isValidPage(888)).toBe(true);
    expect(isValidPage(404)).toBe(false);
    expect(isValidPage(942)).toBe(false);
    expect(NAVIGABLE_PAGES).not.toContain(404);
  });

  it('builds the quick index from pages marked index', () => {
    expect(QUICK_INDEX.map((p) => p.page)).toEqual([100, 101, 110, 200, 300, 400, 888]);
    expect(sidebarRows(QUICK_INDEX).map((r) => rowText(r))).toContain(' 110 EXPERIENCE');
  });
});

describe('buildSemantic', () => {
  it('drops banners, rules, blank and screen-only rows', () => {
    expect(
      buildSemantic([
        { text: '{red}ABOUT{/}', doubleHeight: true },
        '{blue}{rule}{/}',
        '',
        'Hello there.',
        { text: 'Press ← or →', screenOnly: true },
      ]),
    ).toEqual([{ kind: 'paragraph', content: [{ text: 'Hello there.' }] }]);
  });

  it('keeps each logical row whole, however long, and collapses alignment spaces', () => {
    const long = 'word '.repeat(30).trim();
    expect(buildSemantic([long, '{green}TECH{/}    React'])).toEqual([
      { kind: 'paragraph', content: [{ text: long }] },
      { kind: 'paragraph', content: [{ text: 'TECH React' }] },
    ]);
  });

  it('makes headings, bullet lists and inline page links', () => {
    expect(buildSemantic([{ text: '{yellow}FanDuel{/}', heading: true }, '* One', '* Two', '', 'See {link:110}110{/}.'])).toEqual([
      { kind: 'heading', content: [{ text: 'FanDuel' }] },
      { kind: 'list', items: [[{ text: 'One' }], [{ text: 'Two' }]] },
      { kind: 'paragraph', content: [{ text: 'See ' }, { text: '110', page: 110 }, { text: '.' }] },
    ]);
  });

  it('turns a page directory into a list of whole-row links, with indented rows continuing an item', () => {
    expect(buildSemantic(['{link:201}201{/}  {yellow}Isolate UI{/}', '     A sandbox.', '', '{link:202}202{/}  Lighthouse'])).toEqual([
      {
        kind: 'list',
        items: [[{ text: '201 Isolate UI', page: 201 }, { text: ': ' }, { text: 'A sandbox.' }]],
      },
      { kind: 'list', items: [[{ text: '202 Lighthouse', page: 202 }]] },
    ]);
  });

  it('links email and web addresses', () => {
    expect(autolink('Mail steve@example.com or see github.com/x/y-z.')).toEqual([
      { text: 'Mail ' },
      { text: 'steve@example.com', href: 'mailto:steve@example.com' },
      { text: ' or see ' },
      { text: 'github.com/x/y-z', href: 'https://github.com/x/y-z' },
      { text: '.' },
    ]);
    expect(autolink('Node.js and CI/CD')).toEqual([{ text: 'Node.js and CI/CD' }]);
  });

  it('gives every real page a mirror with content in each sub-page', () => {
    for (const page of PAGES) {
      expect(page.semantic).toHaveLength(page.wide.length);
      page.semantic.forEach((blocks) => expect(blocks.length).toBeGreaterThan(0));
    }
    const contact = getPage(400)!.semantic[0];
    expect(contact.filter((b) => b.kind === 'heading')).toHaveLength(4);
    expect(JSON.stringify(contact)).toContain('"href":"mailto:steve.robertson80@gmail.com"');
  });
});
