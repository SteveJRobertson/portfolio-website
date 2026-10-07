import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ICON_CELLS, RULE, parseMarkup } from './markup';
import { layoutBanner } from './banner';
import { blockBitmap, mixedBitmap, unsupportedChars, unsupportedMixedChars } from './blockFont';
import { layoutRows, slotsUsed } from './wrap';
import { compilePages, type SourceFile } from './compile';
import { compilePageDir } from '../../scripts/lib/pageFiles';
import { autolink, buildSemantic } from './semantic';
import { NARROW_BODY_ROWS, NARROW_COLS, WIDE_BODY_ROWS, type PageSource } from './schema';
import { documentTitle, missingDescriptions } from './meta';
import { NAVIGABLE_PAGES, PAGES, QUICK_INDEX, getPage, isValidPage } from './registry';
import { sidebarRows } from '../display/sidebar';
import { fitRow, rowLength, rowText } from '../display/rows';
import { THIN_LINE, type GridRow } from '../types/teletext';

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
    expect(parseMarkup('{blue}{rule}{/}')).toMatchObject({ fill: RULE, fillColor: 'blue', segments: [] });
    expect(parseMarkup('{rule:-}')).toMatchObject({ fill: '-', fillColor: 'white' });
  });

  it('reads {line} as a thin solid line across the row', () => {
    expect(parseMarkup('{cyan}{line}{/}')).toMatchObject({ fill: THIN_LINE, fillColor: 'cyan', segments: [] });
    const fitted = fitRow({ segments: [{ text: '', color: 'cyan' }], fill: THIN_LINE }, 10);
    expect(fitted.segments).toEqual([{ text: THIN_LINE.repeat(10), color: 'cyan', line: true }]);
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

describe('icons', () => {
  it('takes two cells for an icon and checks its name', () => {
    expect(parseMarkup('{icon:email} {green}EMAIL{/}').segments).toEqual([
      { text: ICON_CELLS, icon: 'email' },
      { text: ' ', color: 'white' },
      { text: 'EMAIL', color: 'green' },
    ]);
    expect(parseMarkup('{icon:myspace}').errors.join()).toContain('unknown icon "myspace"');
  });

  it('keeps an icon whole when a line wraps, and apart from the text', () => {
    const { rows } = layoutRows(['{icon:github} {cyan}github.com/SteveJRobertson/lighthouse-compare{/}'], 20);
    expect(rows[0].segments.filter((s) => s.icon)).toEqual([{ text: ICON_CELLS, icon: 'github' }]);
    expect(rows.slice(1).some((r) => r.segments.some((s) => s.icon))).toBe(false);
  });

  it('leaves icons out of the semantic page: the words beside them name them', () => {
    expect(buildSemantic([{ text: '{icon:linkedin} {green}LINKEDIN{/}', heading: true }])).toEqual([
      { kind: 'heading', content: [{ text: 'LINKEDIN' }] },
    ]);
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

  it('draws "* " bullets as yellow squares and hangs them and page numbers', () => {
    const { rows } = layoutRows(['* aaa bbb ccc', '201  ddd eee fff'], 12);
    expect(rows[0].segments.find((s) => s.text.includes('■'))?.color).toBe('yellow');
    expect(texts(rows)).toEqual([
      ' ■ aaa bbb',
      '   ccc',
      ' 201  ddd',
      '      eee',
      '      fff',
    ]);
  });

  it('links email and web addresses, with the full target on every wrapped piece', () => {
    const rows = layoutRows(['{cyan}github.com/SteveJRobertson/isolate-ui{/}'], 20).rows;
    expect(rows.length).toBeGreaterThan(1);
    for (const row of rows) {
      expect(row.segments.filter((s) => s.text.trim()).every((s) => s.href === 'https://github.com/SteveJRobertson/isolate-ui')).toBe(true);
    }
    const [mail] = layoutRows(['Mail me@example.com now'], 38).rows;
    expect(mail.segments.find((s) => s.href)).toEqual({ text: 'me@example.com', color: 'white', href: 'mailto:me@example.com' });
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

  it('stretches a {dots} leader so the rest of the line meets the right edge', () => {
    const { rows, errors } = layoutRows(['Skills{dots}{link:300}300{/}'], 20);
    expect(errors).toEqual([]);
    expect(texts(rows)).toEqual([' Skills..........300']);
    expect(rows[0].segments.at(-1)).toEqual({ text: '300', color: 'cyan', link: 300 });
    expect(layoutRows(['A very long label{dots}300'], 20).errors[0]).toMatch(/too long for its "\{dots\}" leader/);
    expect(parseMarkup('{dots}A{dots}').errors).toContain('only one "{dots}" fits on a line');
  });

  it('links a whole directory line, dots included, when the link wraps it', () => {
    const { rows } = layoutRows(['{link:300}{white}Skills{dots}{/}300{/}'], 20);
    expect(texts(rows)).toEqual([' Skills..........300']);
    expect(rows[0].segments.slice(1)).toEqual([
      { text: 'Skills', color: 'white', link: 300 },
      { text: '..........', color: 'white', link: 300, leaderDots: true },
      { text: '300', color: 'cyan', link: 300 },
    ]);
    expect(buildSemantic(['{link:300}{white}Skills{dots}{/}300{/}'])).toEqual([
      { kind: 'list', items: [[{ text: '300 Skills', page: 300 }]] },
    ]);
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
    expect(pages[0].wide.map((rows) => texts(rows)[0])).toEqual([' One', ' Two']);
  });

  it('puts the ← → hint in the last body row of every sub-page', () => {
    const { pages, errors } = compilePages([
      file(source({ rows: undefined, subpages: [['One'], ['Two']], hint: '{white}Press ← or → for more roles.{/}' })),
    ]);
    expect(errors).toEqual([]);
    for (const [layout, limit] of [[pages[0].wide, WIDE_BODY_ROWS], [pages[0].narrow, NARROW_BODY_ROWS]] as const) {
      for (const rows of layout) {
        expect(rows).toHaveLength(limit);
        expect(texts(rows).at(-1)).toBe(' Press ← or → for more roles.');
      }
    }
    expect(texts(compilePages([file(source({ rows: undefined, subpages: [['One'], ['Two']] }))]).pages[0].wide[0]).at(-1)).toBe(
      ' Press ← or → for more.',
    );
  });

  it('keeps a blank row and the hint clear of sub-page content', () => {
    const full = Array.from({ length: WIDE_BODY_ROWS - 1 }, (_, i) => `Line ${i}`);
    expect(errorsFor(file(source({ rows: undefined, subpages: [full, ['Two']] })))).toContain(
      `needs ${WIDE_BODY_ROWS - 1} rows; the limit is ${WIDE_BODY_ROWS - 2}, leaving a blank row and the ← → hint`,
    );
    expect(errorsFor(file(source({ hint: 'Press ←' })))).toContain('"hint" is only for pages with "subpages"');
  });

  const errorsFor = (...files: SourceFile[]) => compilePages(files).errors.join('\n');

  it('rejects a page with too many rows for either layout', () => {
    expect(errorsFor(file(source({ rows: Array(WIDE_BODY_ROWS + 1).fill('x') })))).toContain(
      `page100.json (38 columns): needs ${WIDE_BODY_ROWS + 1} rows; the limit is ${WIDE_BODY_ROWS}`,
    );
    const long = 'word '.repeat(200); // 29 lines at 38 columns, 34 in portrait
    expect(errorsFor(file(source({ rows: [long] })))).toContain('(portrait): needs');
    expect(errorsFor(file(source({ mobileRows: Array(NARROW_BODY_ROWS + 1).fill('x') })))).toContain(
      `the limit is ${NARROW_BODY_ROWS}`,
    );
  });

  it('rejects a mobile row wider than the portrait grid', () => {
    expect(errorsFor(file(source({ mobileRows: ['x'.repeat(NARROW_COLS)] })))).toContain(
      `is ${NARROW_COLS + 1} cells wide; the limit is ${NARROW_COLS}`,
    );
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

  it('compiles every page and image with no errors', () => {
    expect(compilePageDir().errors).toEqual([]);
  });

  it('fits every screen at both widths', () => {
    for (const page of PAGES) {
      page.wide.forEach((rows) => expect(slotsUsed(rows)).toBeLessThanOrEqual(WIDE_BODY_ROWS));
      page.narrow.forEach((rows) => expect(slotsUsed(rows)).toBeLessThanOrEqual(NARROW_BODY_ROWS));
      page.narrow.forEach((rows) => rows.forEach((r) => expect(r.fill || rowLength(r) <= NARROW_COLS).toBeTruthy()));
    }
  });

  it.each(['Antigravity', 'Storybook 8', 'Solutions Architect', 'over a decade', 'architecture consulting'])(
    'never says "%s" (CONTENT.md: copy to drop)',
    (phrase) => {
      raw.forEach((json) => expect(json.toLowerCase()).not.toContain(phrase.toLowerCase()));
    },
  );

  it('gives every page but 404 its own description', () => {
    expect(missingDescriptions(PAGES)).toEqual([]);
  });

  it('has the approved page map', () => {
    expect(PAGES.map((p) => p.page)).toEqual([100, 101, 110, 200, 201, 202, 203, 300, 400, 404, 888]);
    expect(getPage(110)?.wide).toHaveLength(7);
    expect(getPage(300)?.wide).toHaveLength(3);
  });
});

describe('meta', () => {
  it('leads titles with the subject and keeps the page number', () => {
    expect(documentTitle(110, 'Experience')).toBe('Experience (P110) | Steve Robertson');
    expect(documentTitle(100, 'Steve Robertson: Frontend Software Engineer')).toBe('Steve Robertson: Frontend Software Engineer (P100)');
  });

  it('lets only the not-found page go without a description', () => {
    expect(missingDescriptions([{ page: 404 }, { page: 201 }, { page: 202, description: 'Lighthouse' }])).toEqual([201]);
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
        { banner: 'ABOUT', bg: 'black', rule: 'yellow' },
        '{blue}{rule}{/}',
        '',
        'Hello there.',
        { text: 'Press ← or →', screenOnly: true },
      ]),
    ).toEqual([{ kind: 'paragraph', content: [{ text: 'Hello there.' }] }]);
  });

  it('keeps double-height text, which on screen is a lead line, not the title', () => {
    expect(buildSemantic([{ text: 'Frontend Software Engineer', doubleHeight: true }])).toEqual([
      { kind: 'paragraph', content: [{ text: 'Frontend Software Engineer' }] },
    ]);
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
    expect(contact.filter((b) => b.kind === 'heading')).toHaveLength(3);
    expect(JSON.stringify(contact)).toContain('"href":"mailto:steve.robertson80@gmail.com"');
  });
});

describe('banners', () => {
  it('draws block letters six pixels tall, bold or condensed', () => {
    expect(blockBitmap('HI', 'bold')).toEqual(['##.##.##', '##.##.##', '#####.##', '##.##.##', '##.##.##', '##.##.##']);
    expect(blockBitmap('E', 'condensed')).toEqual(['####', '##..', '###.', '##..', '##..', '####']);
    expect(unsupportedChars('Café!')).toEqual(['É']);
  });

  it('lays out two band rows and a lip, the band starting one cell in', () => {
    const { rows, errors } = layoutBanner({ banner: 'SKILLS', bg: 'yellow' }, 38);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(3);
    for (const row of rows.slice(0, 2)) {
      expect(rowLength(row)).toBe(38);
      expect(row.segments[0]).toEqual({ text: ' ' });
      expect(row.segments.slice(1).every((s) => s.bg === 'yellow' && s.mosaic)).toBe(true);
      expect(row.fillBg).toBe('yellow');
    }
    expect(rows[2]).toEqual({ segments: [{ text: ' ', color: 'yellow' }], fill: String.fromCodePoint(0x1fb02) });
  });

  it('draws mixed case nine pixels tall, with descenders below the capitals', () => {
    const [top, , , , , , baseline, , bottom] = mixedBitmap('Ap', 'bold');
    expect(top).toBe('.###.......');
    expect(baseline).toBe('##.##.####.');
    expect(bottom).toBe('......##...');
    expect(mixedBitmap('mv', 'bold')[3]).toBe('##.##.#.##..##');
    expect(unsupportedMixedChars('Café')).toEqual(['é']);
  });

  it('lays out a masthead on black: three rows of letters at the margin, then a thin line', () => {
    const { rows, errors } = layoutBanner({ banner: '{green}Projects{/}', bg: 'black', rule: 'yellow' }, 38);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(4);
    for (const row of rows.slice(0, 3)) {
      expect(rowLength(row)).toBe(38);
      expect(row.segments[1]).toMatchObject({ text: '', bg: 'black' });
      expect(row.segments[2].color).toBe('green');
    }
    expect(rows[3]).toEqual({ segments: [{ text: '', color: 'yellow' }], fill: THIN_LINE });
    expect(layoutBanner({ banner: '{red}About me{/}', bg: 'black' }, 38).rows[3].segments[0].color).toBe('red');
  });

  it('colours each run and falls back to condensed letters, then double height', () => {
    const name = layoutBanner({ banner: '{white}STEVE{/} {yellow}ROBERTSON{/}', bg: 'blue' }, 38);
    expect(name.errors).toEqual([]);
    expect(name.rows[0].segments.map((s) => s.color).filter((c) => c !== 'white')).toContain('yellow');
    expect(rowLength(name.rows[0])).toBe(38);

    const portrait = layoutBanner({ banner: 'EXPERIENCE', bg: 'red' }, 20);
    expect(portrait.rows[0].doubleHeight).toBe(true);
    expect(rowText(portrait.rows[0])).toBe('   EXPERIENCE       ');
    expect(slotsUsed(portrait.rows)).toBe(3);

    expect(layoutBanner({ banner: 'A TITLE FAR TOO LONG FOR THIS', bg: 'red' }, 20).errors[0]).toMatch(/too long for 20 columns/);
    expect(layoutBanner({ banner: '{link:101}X{/}', bg: 'red' }, 38).errors).toContain('a banner takes only colour tags');
  });

  it('leaves banners out of the mirror and reads a dotted directory as a list', () => {
    expect(
      buildSemantic([{ banner: 'INDEX', bg: 'blue' }, 'About me{dots}{link:101}101{/}', 'Skills{dots}{link:300}300{/}']),
    ).toEqual([{ kind: 'list', items: [[{ text: '101 About me', page: 101 }], [{ text: '300 Skills', page: 300 }]] }]);
  });
});
