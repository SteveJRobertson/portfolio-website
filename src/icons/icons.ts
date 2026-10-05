import { PALETTE_RGB, toMosaic, type RgbaImage } from '../content/mosaic.ts';
import type { GridRow, TeletextColor } from '../types/teletext.ts';

/**
 * Social and sharing icons as Teletext pixel art: 14 × 12 pixels, which is
 * 7 columns by 4 rows of mosaic cells (2 × 3 pixels a cell). Like a real set,
 * a cell can show two colours, so a two-colour icon keeps its second colour
 * away from the black around it. `iconRows` turns one into grid rows.
 */

/** One character a pixel: `.` the black screen, the rest Teletext colours. */
export const ICON_PIXELS: Record<string, TeletextColor> = {
  '.': 'black',
  k: 'black',
  w: 'white',
  b: 'blue',
  c: 'cyan',
  g: 'green',
  y: 'yellow',
  m: 'magenta',
  r: 'red',
};

export interface Icon {
  /** What the icon stands for, for its accessible name. */
  label: string;
  grid: readonly string[];
}

export const ICON_WIDTH = 14;
export const ICON_HEIGHT = 12;

export const ICONS = {
  facebook: {
    label: 'Facebook',
    grid: [
      '.....bbbb.....',
      '...bbbbbbbb...',
      '..bbbbbbbbbb..',
      '.bbbbbbwwwwbb.',
      'bbbbbbwwbbbbbb',
      'bbbbbbwwbbbbbb',
      'bbbbwwwwwwbbbb',
      'bbbbbbwwbbbbbb',
      '.bbbbbwwbbbbb.',
      '..bbbbwwbbbb..',
      '...bbbwwbbb...',
      '....bbwwbb....',
    ],
  },
  linkedin: {
    label: 'LinkedIn',
    grid: [
      '.bbbbbbbbbbbb.',
      'bbwwbbbbbbbbbb',
      'bbwwbbbbbbbbbb',
      'bbbbbbbbbbbbbb',
      'bbwwbbwwwwwbbb',
      'bbwwbbwwbbwwbb',
      'bbwwbbwwbbwwbb',
      'bbwwbbwwbbwwbb',
      'bbwwbbwwbbwwbb',
      'bbwwbbwwbbwwbb',
      'bbbbbbbbbbbbbb',
      '.bbbbbbbbbbbb.',
    ],
  },
  instagram: {
    label: 'Instagram',
    grid: [
      '..mmmmmmmmmm..',
      '.mm........mm.',
      'mm........m.mm',
      'mm...mmmm...mm',
      'mm..mm..mm..mm',
      'mm.mm....mm.mm',
      'mm.mm....mm.mm',
      'mm..mm..mm..mm',
      'mm...mmmm...mm',
      'mm..........mm',
      '.mm........mm.',
      '..mmmmmmmmmm..',
    ],
  },
  x: {
    label: 'X',
    grid: [
      'wwww........ww',
      '.w..w......w..',
      '..w..w....w...',
      '...w..w..w....',
      '....w..ww.....',
      '.....w..w.....',
      '.....w..w.....',
      '.....ww..w....',
      '....w..w..w...',
      '...w....w..w..',
      '..w......w..w.',
      'ww........wwww',
    ],
  },
  email: {
    label: 'Email',
    grid: [
      '..............',
      'yyyyyyyyyyyyyy',
      'yy..........yy',
      'y.y........y.y',
      'y..y......y..y',
      'y...y....y...y',
      'y....y..y....y',
      'y.....yy.....y',
      'y............y',
      'y............y',
      'yyyyyyyyyyyyyy',
      '..............',
    ],
  },
  share: {
    label: 'Share',
    grid: [
      '..........cc..',
      '.........cccc.',
      '.......cc.cc..',
      '.....cc.......',
      '..cccc........',
      '.cccccc.......',
      '.cccccc.......',
      '..cccc........',
      '.....cc.......',
      '.......cc.cc..',
      '.........cccc.',
      '..........cc..',
    ],
  },
  link: {
    label: 'Copy link',
    grid: [
      '..............',
      '..........ccc.',
      '........cc..cc',
      '.......cc...cc',
      '.....ccc...cc.',
      '....cc..c.cc..',
      '..cc.c..cc....',
      '.cc...ccc.....',
      'cc...cc.......',
      'cc..cc........',
      '.ccc..........',
      '..............',
    ],
  },
  github: {
    label: 'GitHub',
    grid: [
      '....wwwwww....',
      '..wwwwwwwwww..',
      '.wwwwwwwwwwww.',
      '.ww.wwwwww.ww.',
      'www..wwww..www',
      'www........www',
      'www........www',
      '.ww........ww.',
      '.www......www.',
      '..w.w....www..',
      '...ww....ww...',
      '....w....w....',
    ],
  },
  bluesky: {
    label: 'Bluesky',
    grid: [
      '.b..........b.',
      '.bbb......bbb.',
      'bbbbb....bbbbb',
      'bbbbbb..bbbbbb',
      'bbbbbbbbbbbbbb',
      'bbbbbbbbbbbbbb',
      '.bbbbbbbbbbbb.',
      '..bbbbbbbbbb..',
      '.bbbbbbbbbbbb.',
      '.bbbbb..bbbbb.',
      '..bbbb..bbbb..',
      '...bb....bb...',
    ],
  },
  whatsapp: {
    label: 'WhatsApp',
    grid: [
      '....gggggg....',
      '..gg......gg..',
      '.g..........g.',
      '.g..gg......g.',
      'g...gg.......g',
      'g....g.......g',
      'g.....g......g',
      'g......ggg...g',
      '.g.....ggg..g.',
      '.g.........g..',
      'g.gg.....gg...',
      'ggg.ggggg.....',
    ],
  },
} satisfies Record<string, Icon>;

export type IconName = keyof typeof ICONS;

export const ICON_NAMES = Object.keys(ICONS) as IconName[];

/** The colour most of an icon's pixels use: its brand colour, or white for a white mark. */
export const mainColor = (name: IconName): TeletextColor => {
  const counts = new Map<string, number>();
  for (const ch of ICONS[name].grid.join('')) if (ICON_PIXELS[ch] !== 'black') counts.set(ch, (counts.get(ch) ?? 0) + 1);
  const [ch] = [...counts].reduce((best, entry) => (entry[1] > best[1] ? entry : best));
  return ICON_PIXELS[ch];
};

/**
 * An icon's pixels. With `color`, it's drawn in that one colour: the main
 * colour takes it and any second colour (the white "f" on Facebook's disc)
 * is cut out to black.
 */
export const iconImage = (name: IconName, color?: TeletextColor): RgbaImage => {
  const main = mainColor(name);
  const data = new Uint8Array(ICON_WIDTH * ICON_HEIGHT * 4);
  ICONS[name].grid.forEach((row, y) =>
    Array.from(row).forEach((ch, x) => {
      const own = ICON_PIXELS[ch];
      const pixel = color ? (own === main ? color : 'black') : own;
      if (pixel !== 'black') data.set([...PALETTE_RGB[pixel], 255], (y * ICON_WIDTH + x) * 4);
    }),
  );
  return { width: ICON_WIDTH, height: ICON_HEIGHT, data };
};

/** An icon as 4 rows of 7 mosaic cells, ready for the grid. */
export const iconRows = (name: IconName, color?: TeletextColor): GridRow[] =>
  toMosaic(iconImage(name, color), { rows: ICON_HEIGHT / 3, cols: ICON_WIDTH / 2 });
