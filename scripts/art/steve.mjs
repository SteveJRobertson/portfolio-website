// Steve's portrait for page 101, drawn the way Channel 4 drew Bamber on
// Bamboozle!: one face colour carved up by black lines, flat colour only where
// a whole cell holds it (cap, beard, fleece). Writes a 2x3-pixels-a-cell PNG
// in Teletext colours and checks every cell keeps to two colours.
// Usage: node scripts/art/steve.mjs src/content/images [previewdir]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(path.join(process.cwd(), 'package.json'));
const { PNG } = require('pngjs');

const RGB = { W: [255,255,0], w: [255,255,255], c: [0,255,255], r: [255,51,51], b: [77,121,255], g: [0,255,0], m: [255,0,255], '.': null };

// 28 x 30 pixels = 14 cells x 10 rows. W is the face (yellow), c the cap, w the beard.
const steve = [
  '.............cc.............',
  '.........cccccccccc.........',
  '.......cccccccccccccc.......',
  '......cccccccccccccccc......',
  '.....cccccccccccccccccc.....',
  '.....ccccccccccccccccccc....',
  '...cc....................cc.',
  '..cccccccccccccccccccccccccc',
  '......cccccccccccccccccccc..',
  '....WWWWWWWWWWWWWWWWWWWW....',
  '...WW.....WWWWWWWW.....WW...',
  '..WWWWWWWWWWWWWWWWWWWWWWWW..',
  '..W.WWW...WWWWWWWW...WWW.W..',
  '..W.WWWW..WWWWWWWW..WWWW.W..',
  '..WWWWWWWWWWWW.WWWWWWWWWWW..',
  '...WWWWWWWWWWW.WWWWWWWWWW...',
  '...WWWWWWWWWWW..WWWWWWWWW...',
  '....WWWWWWWW....WWWWWWWW....',
  '....WWWW.wwwwwwwwww.WWWW....',
  '....WWWW.wwwwwwwwww.WWWW....',
  '....WWWW.ww......ww.WWWW....',
  '....WWwwwwwwwwwwwwwwwwWW....',
  '......wwwwwwwwwwwwwwww......',
  '.......wwwwwwwwwwwwww.......',
  '..........wwwwwwww..........',
  '.rr........wwwwww........rr.',
  'rrrr.......wwwwww.......rrrr',
  'rrrrrr...bbbbbbbbbb...rrrrrr',
  'rrrrrrr..bbbbbbbbbb..rrrrrrr',
  'rrrrrrr..bbbbbbbbbb..rrrrrrr',
];

const write = (file, rows, scale) => {
  const h = rows.length, w = rows[0].length;
  rows.forEach((r, i) => { if (r.length !== w) throw new Error(`${file}: row ${i} is ${r.length} wide, not ${w}`); });
  const png = new PNG({ width: w * scale, height: h * scale });
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const rgb = RGB[ch];
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
    for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 2; dx++) set.add(rows[cr*3+dy][cc*2+dx]);
    set.delete('.');
    if (set.size > 1) bad.push(`${cc+1},${cr+1}:${[...set].join('')}`);
  }
  fs.writeFileSync(file, PNG.sync.write(png));
  console.log(path.basename(file), `${w}x${h}`, bad.length ? `OVERFULL ${bad.join(' ')}` : 'ok');
};

const out = process.argv[2] ?? '.';
const preview = process.argv[3];
write(path.join(out, 'steve.png'), steve, 1);
if (preview) write(path.join(preview, 'steve-preview.png'), steve, 12);
