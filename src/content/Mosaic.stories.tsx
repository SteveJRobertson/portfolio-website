import type { Meta, StoryObj } from '@storybook/react-vite';
import { TeletextGrid } from '../components/TeletextGrid';
import { GridLine } from '../components/GridLine';
import { PALETTE_RGB, toMosaic, type RgbaImage } from './mosaic';
import { TELETEXT_COLORS, type TeletextColor } from '../types/teletext';

/** A test picture drawn pixel by pixel. */
const picture = (width: number, height: number, paint: (x: number, y: number) => TeletextColor): RgbaImage => {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) data.set([...PALETTE_RGB[paint(x, y)], 255], (y * width + x) * 4);
  }
  return { width, height, data };
};

const PATTERNS: Record<string, RgbaImage> = {
  'Colour bars': picture(64, 32, (x) => TELETEXT_COLORS.filter((c) => c !== 'black')[Math.floor(x / (64 / 7))] ?? 'black'),
  Checkerboard: picture(40, 24, (x, y) => ((x + y) % 2 ? 'white' : 'black')),
  Circle: picture(60, 60, (x, y) => ((x - 30) ** 2 + (y - 30) ** 2 < 26 ** 2 ? 'yellow' : 'black')),
  'Smooth gradient': picture(64, 24, (x, y) => (x * 4 + y * 3 > 160 ? 'cyan' : x * 4 + y * 3 > 80 ? 'blue' : 'black')),
};

interface MosaicProps {
  pattern: keyof typeof PATTERNS;
  rows: number;
  fontSize: number;
}

/**
 * The build-time converter (SPEC §8) on test pictures: 2×3 pixels a cell, two
 * colours a cell. The real portrait is on page 101 (Organisms/TeletextGrid, Mosaic).
 */
const Mosaic = ({ pattern, rows, fontSize }: MosaicProps) => {
  const lines = toMosaic(PATTERNS[pattern], { rows });
  const cols = Math.max(...lines.map((l) => l.segments.reduce((n, s) => n + Array.from(s.text).length, 0)));
  return (
    <div style={{ fontSize }}>
      <TeletextGrid cols={cols} rows={rows}>
        {lines.map((content, i) => (
          <GridLine key={i} row={i + 1} width={cols} content={content} />
        ))}
      </TeletextGrid>
    </div>
  );
};

const meta: Meta<typeof Mosaic> = {
  title: 'Atoms/Mosaic',
  component: Mosaic,
  args: { pattern: 'Colour bars', rows: 8, fontSize: 24 },
  argTypes: { pattern: { control: 'select', options: Object.keys(PATTERNS) }, rows: { control: { type: 'number', min: 1, max: 22 } } },
};

export default meta;
type Story = StoryObj<typeof Mosaic>;

export const ColourBars: Story = {};
export const Checkerboard: Story = { args: { pattern: 'Checkerboard' } };
export const Circle: Story = { args: { pattern: 'Circle', rows: 10 } };
export const Gradient: Story = { args: { pattern: 'Smooth gradient' } };
