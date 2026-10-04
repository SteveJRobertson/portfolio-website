import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { TeletextGrid } from './TeletextGrid';
import { GridLine } from './GridLine';
import { HeaderTicker } from './HeaderTicker';
import { FastTextBar } from './FastTextBar';
import { ScanlineOverlay } from './ScanlineOverlay';
import { GRID_MODES, type GridModeName } from '../display/gridModes';
import { layoutBody } from '../display/layout';
import { textRow } from '../display/rows';
import { sidebarRows } from '../display/sidebar';
import { PAGES, QUICK_INDEX, getPage } from '../content/registry';

const SIDEBAR_ROWS = sidebarRows(QUICK_INDEX);

interface ScreenProps {
  mode: GridModeName;
  page: number;
  /** Zero-based sub-page. */
  subpage: number;
  showCells: boolean;
  /** The CRT scanlines and glow. */
  crt?: boolean;
  /** HOLD is on (shown in the header on pages with sub-pages). */
  held?: boolean;
  fontSize?: number;
}

/** A full screen at a fixed font size, so each mode can be compared side by side. */
const Screen = ({ mode: name, page, subpage, showCells, crt = false, held = false, fontSize = 20 }: ScreenProps) => {
  const mode = GRID_MODES[name];
  const data = getPage(page)!;
  const index = Math.min(subpage, data.wide.length - 1);
  const rows = (name === 'portrait' ? data.narrow : data.wide)[index];
  return (
    <div
      style={{ fontSize, position: 'relative' }}
      className={[showCells && 'tt-story-cells', crt && 'teletext-screen--crt'].filter(Boolean).join(' ') || undefined}
    >
      <TeletextGrid cols={mode.cols} rows={mode.rows}>
        <HeaderTicker
          bufferText={`P${page}`}
          currentPage={page}
          cols={mode.cols}
          subpage={{ index, count: data.wide.length, held }}
        />
        {layoutBody(mode, rows, SIDEBAR_ROWS).map(({ key, ...line }) => (
          <GridLine key={key} {...line} />
        ))}
        <FastTextBar links={data.fastext} onNavigate={fn()} cols={mode.cols} row={mode.rows} />
      </TeletextGrid>
      {crt && <ScanlineOverlay />}
      {showCells && (
        <style>{`.tt-story-cells .tt-grid {
          background-image:
            linear-gradient(to right, rgb(255 255 255 / 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(255 255 255 / 0.12) 1px, transparent 1px);
          background-size: var(--tt-cell-w) var(--tt-cell-h);
        }`}</style>
      )}
    </div>
  );
};

const meta: Meta<typeof Screen> = {
  title: 'Organisms/TeletextGrid',
  component: Screen,
  args: { mode: 'classic', page: 100, subpage: 0, showCells: false },
  argTypes: {
    mode: { control: 'inline-radio', options: Object.keys(GRID_MODES) },
    page: { control: 'select', options: PAGES.map((p) => p.page) },
    subpage: { control: { type: 'number', min: 0, max: 5 } },
  },
};

export default meta;
type Story = StoryObj<typeof Screen>;

export const Widescreen: Story = { args: { mode: 'widescreen' } };
export const Classic: Story = {};
export const Portrait: Story = { args: { mode: 'portrait' } };
export const CellOverlay: Story = { args: { showCells: true } };
export const SubPages: Story = { args: { page: 110, subpage: 1 } };
export const Held: Story = { args: { page: 110, subpage: 1, held: true } };
/** The CRT effect from page 888: scanlines, glow and a vignette. */
export const CrtEffect: Story = { args: { mode: 'widescreen', page: 110, crt: true } };
export const CrtEffectOnMosaic: Story = { args: { page: 203, crt: true } };
export const Mosaic: Story = { args: { page: 203 } };
export const MosaicPortrait: Story = { args: { mode: 'portrait', page: 203 } };

/** Every page and sub-page in the registry, so new content shows up here automatically. */
export const AllPages: Story = {
  argTypes: { page: { table: { disable: true } }, subpage: { table: { disable: true } } },
  render: ({ mode, showCells }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
      {PAGES.flatMap((p) =>
        p.wide.map((_, i) => (
          <Screen key={`${p.page}-${i}`} mode={mode} page={p.page} subpage={i} showCells={showCells} fontSize={10} />
        )),
      )}
    </div>
  ),
};

export const DoubleHeight: StoryObj<typeof TeletextGrid> = {
  render: () => (
    <div style={{ fontSize: 32 }}>
      <TeletextGrid cols={20} rows={4}>
        <GridLine row={1} width={20} height={2} content={textRow(' DOUBLE HEIGHT', 'yellow', { doubleHeight: true })} />
        <GridLine row={3} width={20} content={textRow(' Normal height', 'cyan')} />
        <GridLine row={4} width={20} content={textRow(' ' + String.fromCodePoint(0x1fb3b).repeat(18), 'green')} />
      </TeletextGrid>
    </div>
  ),
};
