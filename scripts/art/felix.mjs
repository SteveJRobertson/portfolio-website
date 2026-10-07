// Felix Flummox pixel art, drawn the way Bamber was on Channel 4's Bamboozle!:
// one face colour carved up by black lines, with flat colour only where a
// whole cell can hold it (hair, bow tie, jacket). Writes 2x3-pixels-a-cell
// PNGs in Teletext colours and checks every cell keeps to two colours.
// Usage: node scripts/art/felix.mjs src/content/images [previewdir]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(path.join(process.cwd(), 'package.json'));
const { PNG } = require('pngjs');

const RGB = { w: [255,255,255], y: [255,255,0], c: [0,255,255], r: [255,51,51], b: [77,121,255], g: [0,255,0], m: [255,0,255], '.': null };

// 32 x 24 pixels = 16 cells x 8 rows, as Bamber was (the face is drawn 28 wide, then his hand added). W is the face: yellow, as Bamber's was.
const HAIR = [
  '..........gggggg............',
  '.......gggggggggggg.........',
  '.....ggggggggggggggggggg....',
  '....gggg.ggggggg.ggggggggg..',
  '....ggg.ggggggg.gggggggg.gg.',
  '....g..g......g.......g..g..',
];
const BODY = [
  '..bbbbbbb.rrr..rrr.bbbbbbb..',
  '.bbbbbbbb.rrrrrrrr.bbbbbbbb.',
  'bbbbbbbbb.rrr..rrr.bbbbbbbbb',
];

const happy = [
  ...HAIR,
  '.....WWWWWWWWWWWWWWWWWW.....',
  '....WW.......WW.......WW....',
  '...WW.WWWWWW.WW.WWWWWW.WW...',
  '..WWW.W..WWW....W..WWW.WWW..',
  '..W.W.W..WWW.WW.W..WWW.W.W..',
  '..WWW.WWWWWW.WW.WWWWWW.WWW..',
  '...WWW......WW.W......WWW...',
  '...WWWWWWWWWW..WWWWWWWWWW...',
  '...WW.WWWWWWWWWWWWWWWW.WW...',
  '...WWW.WWWWWWWWWWWWWW.WWW...',
  '....WWW..WWWWWWWWWW..WWW....',
  '.....WWW..WWWWWWWW..WWW.....',
  '......WWW..........WWW......',
  '.......WWWW......WWWW.......',
  '.........WWWWWWWWWW.........',
  ...BODY,
];

// Flummoxed: worried brows, eyes crossed,
// an "O" for a mouth and a cyan bead of sweat.
const flummoxed = [
  ...HAIR,
  '.....WWWW....WW....WWWW.....',
  '.c..WW...WWWWWWWWWW...WW....',
  'cc.WW.WWWWWW.WW.WWWWWW.WW...',
  'ccWWW.WWW.WW....WW.WWW.WWW..',
  'c.W.W.WWW.WW.WW.WW.WWW.W.W..',
  '..WWW.WWWWWW.WW.WWWWWW.WWW..',
  '...WWW......WW.W......WWW...',
  '...WWWWWWWWWW..WWWWWWWWWW...',
  '...WWWWWWWWWWWWWWWWWWWWWW...',
  '...WWWWWWWWW....WWWWWWWWW...',
  '....WWWWWWW......WWWWWWW....',
  '.....WWWWWW......WWWWWW.....',
  '......WWWWWW....WWWWWW......',
  '.......WWWWWWWWWWWWWW.......',
  '.........WWWWWWWWWW.........',
  ...BODY,
];

// His raised hand, 4 columns more on the right, rows 0 to 20 (the body rows add his sleeve).
const blank = '......';
const handRows = (rows) => [...Array(7).fill(blank), ...rows];
const THUMBS_UP = handRows([
  '...WW.', '...WW.', '...WW.', '..WWW.', '.WWWWW', '....WW', '.WWWWW',
  '....WW', '.WWWWW', '....WW', '.WWWWW', '..WWW.', '..WWW.', '..WWW.',
]);
const OPEN_HAND = handRows([
  '...W..', '.W.W.W', '.W.W.W', '.W.W.W', '.WWWWW', 'W.WWWW', 'WWWWWW',
  '.WWWW.', '..WWW.', '..WWW.', '..WWW.', '..WWW.', '..WWW.', '..WWW.',
]);
const SLEEVE = ['.bbbbb', 'bbbbbb', 'bbbbbb'];
const withHand = (rows, hand) => rows.map((row, y) => row.slice(0, 26) + (y < 21 ? hand[y] : SLEEVE[y - 21]));

const write = (file, rows, face, scale) => {
  const h = rows.length, w = rows[0].length;
  rows.forEach((r, i) => { if (r.length !== w) throw new Error(`${file}: row ${i} is ${r.length} wide, not ${w}`); });
  const png = new PNG({ width: w * scale, height: h * scale });
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const rgb = RGB[ch === 'W' ? face : ch];
    for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) {
      const i = ((y * scale + sy) * w * scale + x * scale + sx) * 4;
      if (rgb) { png.data[i] = rgb[0]; png.data[i+1] = rgb[1]; png.data[i+2] = rgb[2]; png.data[i+3] = 255; }
      else if (scale > 1) { png.data[i+3] = 255; } // preview on black
      else png.data[i+3] = 0;
    }
  }));
  const bad = [];
  for (let cr = 0; cr < h / 3; cr++) for (let cc = 0; cc < w / 2; cc++) {
    const set = new Set();
    for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 2; dx++) {
      const ch = rows[cr*3+dy][cc*2+dx];
      set.add(ch === 'W' ? face : ch);
    }
    set.delete('.');
    if (set.size > 1) bad.push(`${cc+1},${cr+1}:${[...set].join('')}`);
  }
  fs.writeFileSync(file, PNG.sync.write(png));
  console.log(path.basename(file), `${w}x${h}`, bad.length ? `OVERFULL ${bad.join(' ')}` : 'ok');
};

const out = process.argv[2] ?? '.';
const preview = process.argv[3];
write(path.join(out, 'felix.png'), withHand(happy, THUMBS_UP), 'y', 1);
write(path.join(out, 'felix-flummoxed.png'), withHand(flummoxed, OPEN_HAND), 'y', 1);
// Portrait screens are too narrow for the hand and a readable bubble, so Felix goes without it there.
write(path.join(out, 'felix-narrow.png'), happy, 'y', 1);
write(path.join(out, 'felix-narrow-flummoxed.png'), flummoxed, 'y', 1);
if (preview) {
  write(path.join(preview, 'felix-preview.png'), withHand(happy, THUMBS_UP), 'y', 12);
  write(path.join(preview, 'felix-flummoxed-preview.png'), withHand(flummoxed, OPEN_HAND), 'y', 12);
}
