import type { TeletextColor } from '../types/teletext.ts';

/**
 * Social and sharing icons as Teletext-style pixel art on a 12 × 12 grid, drawn
 * at 24 × 24 px by `TeletextIcon` so every pixel is a crisp 2 × 2 block. The
 * colours are the Teletext palette.
 */

/** One character a pixel: `.` is clear, the rest are Teletext colours. */
export const ICON_PIXELS: Record<string, TeletextColor> = {
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

export const ICON_GRID = 12;

export const ICONS = {
  facebook: {
    label: 'Facebook',
    grid: [
      '....bbbb....',
      '..bbbbbbbb..',
      '.bbbbbbwwwb.',
      '.bbbbbwwbbb.',
      'bbbbbbwwbbbb',
      'bbbbwwwwwwbb',
      'bbbbbbwwbbbb',
      'bbbbbbwwbbbb',
      '.bbbbbwwbbb.',
      '.bbbbbwwbbb.',
      '..bbbbwwbb..',
      '....bbww....',
    ],
  },
  linkedin: {
    label: 'LinkedIn',
    grid: [
      '.bbbbbbbbbb.',
      'bbwwbbbbbbbb',
      'bbwwbbbbbbbb',
      'bbbbbbbbbbbb',
      'bbwwbwwwwbbb',
      'bbwwbwwbbwwb',
      'bbwwbwwbbwwb',
      'bbwwbwwbbwwb',
      'bbwwbwwbbwwb',
      'bbwwbwwbbwwb',
      'bbbbbbbbbbbb',
      '.bbbbbbbbbb.',
    ],
  },
  instagram: {
    label: 'Instagram',
    grid: [
      '.mmmmmmmmmm.',
      'm..........m',
      'm........m.m',
      'm...mmmm...m',
      'm..m....m..m',
      'm..m....m..m',
      'm..m....m..m',
      'm..m....m..m',
      'm...mmmm...m',
      'm..........m',
      'm..........m',
      '.mmmmmmmmmm.',
    ],
  },
  x: {
    label: 'X',
    grid: [
      'wwww.......w',
      '.w..w.....w.',
      '.w..w....w..',
      '..w..w..w...',
      '...w..ww....',
      '....w..w....',
      '....w..w....',
      '....ww..w...',
      '...w..w..w..',
      '..w....w..w.',
      '.w.....w..w.',
      'w.......wwww',
    ],
  },
  email: {
    label: 'Email',
    grid: [
      '............',
      '............',
      'yyyyyyyyyyyy',
      'yy........yy',
      'y.y......y.y',
      'y..y....y..y',
      'y...y..y...y',
      'y....yy....y',
      'y..........y',
      'yyyyyyyyyyyy',
      '............',
      '............',
    ],
  },
  share: {
    label: 'Share',
    grid: [
      '.........cc.',
      '........cccc',
      '......cccccc',
      '....cc...cc.',
      '.cccc.......',
      'cccc........',
      'cccc........',
      '.cccc.......',
      '....cc...cc.',
      '......cccccc',
      '........cccc',
      '.........cc.',
    ],
  },
  link: {
    label: 'Copy link',
    grid: [
      '............',
      '........ccc.',
      '.......c...c',
      '......c....c',
      '....ccc...c.',
      '...c..c..c..',
      '..c..c..c...',
      '.c...ccc....',
      'c....c......',
      'c...c.......',
      '.ccc........',
      '............',
    ],
  },
  github: {
    label: 'GitHub',
    grid: [
      '....wwww....',
      '..wwwwwwww..',
      '.wwwwwwwwww.',
      '.w.wwwwww.w.',
      'ww..wwww..ww',
      'ww........ww',
      'ww........ww',
      'ww........ww',
      '.ww......ww.',
      '.w.w....www.',
      '..ww....ww..',
      '............',
    ],
  },
  bluesky: {
    label: 'Bluesky',
    grid: [
      'b..........b',
      'bbb......bbb',
      'bbbb....bbbb',
      'bbbbb..bbbbb',
      'bbbbbbbbbbbb',
      'bbbbbbbbbbbb',
      '.bbbbbbbbbb.',
      '..bbbbbbbb..',
      '.bbbbbbbbbb.',
      '.bbbb..bbbb.',
      '..bbb..bbb..',
      '...b....b...',
    ],
  },
  whatsapp: {
    label: 'WhatsApp',
    grid: [
      '...gggggg...',
      '.gg......gg.',
      '.g........g.',
      'g..gg......g',
      'g..gg......g',
      'g...g......g',
      'g....g.....g',
      'g.....ggg..g',
      'g.....ggg..g',
      '.g........g.',
      'g.gg....gg..',
      'ggg.gggg....',
    ],
  },
  threads: {
    // A white tile with the Threads mark cut out of it, like the app icon: a bare mark read as "@".
    label: 'Threads',
    grid: [
      '.wwwwwwwwww.',
      'wwwwwwwwwwww',
      'wwww....wwww',
      'www.wwww.www',
      'ww.wwwwww.ww',
      'ww.ww...w.ww',
      'ww.w.ww.w.ww',
      'ww.w.ww..www',
      'ww.ww..w.www',
      'www.wwww.www',
      'wwww....wwww',
      '.wwwwwwwwww.',
    ],
  },
} satisfies Record<string, Icon>;

export type IconName = keyof typeof ICONS;

export const ICON_NAMES = Object.keys(ICONS) as IconName[];

/** The colour most of an icon's pixels use: its brand colour, or white for a white mark. */
export const mainColor = (name: IconName): TeletextColor => {
  const counts = new Map<string, number>();
  for (const ch of ICONS[name].grid.join('')) if (ch in ICON_PIXELS) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  const [ch] = [...counts].reduce((best, entry) => (entry[1] > best[1] ? entry : best));
  return ICON_PIXELS[ch];
};

export interface IconRun {
  x: number;
  y: number;
  width: number;
  color: TeletextColor;
}

/**
 * An icon as horizontal runs of one colour, for drawing. With `color`, it's
 * one colour: the main colour takes it and any second colour (the white "f"
 * on Facebook's disc) is cut out.
 */
export const iconRuns = (name: IconName, color?: TeletextColor): IconRun[] => {
  const main = mainColor(name);
  return ICONS[name].grid.flatMap((row, y) =>
    [...row.matchAll(/(.)\1*/g)].flatMap((run): IconRun[] => {
      const own = ICON_PIXELS[run[1]];
      if (!own || (color && own !== main)) return [];
      return [{ x: run.index, y, width: run[0].length, color: color ?? own }];
    }),
  );
};
