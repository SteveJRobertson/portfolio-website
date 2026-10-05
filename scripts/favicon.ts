import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

/**
 * Draws the site icon from one 16 × 16 pixel grid and writes `public/favicon.svg`,
 * `public/favicon.ico` (16, 32 and 48 px) and `public/apple-touch-icon.png`
 * (180 px): a yellow block "S" on a blue Ceefax banner over the four Fastext
 * colours. Run `npm run favicon` after changing the grid.
 */

/** One character a pixel: b blue, y yellow, r red, g green, c cyan, k black. */
const GRID = [
  'bbbbbbbbbbbbbbbb',
  'bbbbbyyyyyyyybbb',
  'bbbbbyyyyyyyybbb',
  'bbbyybbbbbbbbbbb',
  'bbbyybbbbbbbbbbb',
  'bbbbbyyyyyybbbbb',
  'bbbbbyyyyyybbbbb',
  'bbbbbbbbbbbyybbb',
  'bbbbbbbbbbbyybbb',
  'bbbyyyyyyyybbbbb',
  'bbbyyyyyyyybbbbb',
  'bbbbbbbbbbbbbbbb',
  'kkkkkkkkkkkkkkkk',
  'rrrrggggyyyycccc',
  'rrrrggggyyyycccc',
  'rrrrggggyyyycccc',
];

/** Banner blue from `.bg-blue`, the rest the Teletext text colours in `index.css`. */
const COLORS: Record<string, string> = {
  b: '#0000cc',
  y: '#ffff00',
  r: '#ff3333',
  g: '#00ff00',
  c: '#00ffff',
  k: '#000000',
};

const SIZE = GRID.length;
const publicDir = path.resolve(import.meta.dirname, '../public');

/** Horizontal runs of one colour, so the SVG stays small. */
const svg = () => {
  const rects = GRID.flatMap((row, y) =>
    [...row.matchAll(/(.)\1*/g)].map(
      (run) => `<rect x="${run.index}" y="${y}" width="${run[0].length}" height="1" fill="${COLORS[run[1]]}"/>`,
    ),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" shape-rendering="crispEdges">${rects.join('')}</svg>\n`;
};

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** The grid scaled up to `size` px, nearest neighbour, centred on black when it doesn't divide evenly. */
const png = (size: number) => {
  const image = new PNG({ width: size, height: size });
  const scale = Math.floor(size / SIZE);
  const offset = Math.floor((size - scale * SIZE) / 2);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = Math.floor((x - offset) / scale);
      const gy = Math.floor((y - offset) / scale);
      const key = GRID[gy]?.[gx] ?? 'k';
      const [r, g, b] = rgb(COLORS[key]);
      image.data.set([r, g, b, 255], (y * size + x) * 4);
    }
  }
  return PNG.sync.write(image);
};

/** An ICO file holding PNG images, which every browser that asks for `/favicon.ico` reads. */
const ico = (sizes: number[]) => {
  const images = sizes.map(png);
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((size, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size, entry);
    header.writeUInt8(size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(images[i].length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += images[i].length;
  });
  return Buffer.concat([header, ...images]);
};

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svg());
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico([16, 32, 48]));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png(180));
console.log('Wrote public/favicon.svg, public/favicon.ico and public/apple-touch-icon.png');
