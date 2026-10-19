// The Flummox! logo: chunky mosaic letters in the style of the Bamboozle! logo.
// Usage: node scripts/art/logo.mjs src/content/images
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(path.join(process.cwd(), 'package.json'));
const { PNG } = require('pngjs');

// 9 pixels tall (three grid rows); lower case sits on rows 3 to 8.
const G = {
  F: ['#######', '#######', '###....', '###....', '######.', '######.', '###....', '###....', '###....'],
  l: ['###', '###', '###', '###', '###', '###', '###', '###', '###'],
  u: ['.......', '.......', '.......', '###.###', '###.###', '###.###', '###.###', '#######', '.######'],
  m: ['...........', '...........', '...........', '##########.', '###########', '###.###.###', '###.###.###', '###.###.###', '###.###.###'],
  o: ['.......', '.......', '.......', '.#####.', '#######', '###.###', '###.###', '#######', '.#####.'],
  x: ['.......', '.......', '.......', '###.###', '.#####.', '..###..', '.#####.', '###.###', '###.###'],
  '!': ['###', '###', '###', '###', '###', '###', '...', '###', '###'],
};

const word = 'Flummox!';
const rows = Array.from({ length: 9 }, (_, y) => [...word].map((c) => G[c][y]).join('.'));
// pad to whole cells
const width = Math.ceil(rows[0].length / 2) * 2;
const padded = rows.map((r) => r.padEnd(width, '.'));

const png = new PNG({ width, height: 9 });
padded.forEach((row, y) => [...row].forEach((ch, x) => {
  const i = (y * width + x) * 4;
  if (ch === '#') { png.data[i] = 255; png.data[i + 1] = 255; png.data[i + 2] = 0; png.data[i + 3] = 255; } else png.data[i + 3] = 0;
}));
const out = process.argv[2] ?? '.';
fs.writeFileSync(path.join(out, 'flummox-logo.png'), PNG.sync.write(png));
console.log('flummox-logo.png', `${width}x9`, `${width / 2} cells`);
padded.forEach((r) => console.log(r.replace(/\./g, ' ')));
