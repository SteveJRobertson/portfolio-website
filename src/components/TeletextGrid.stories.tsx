import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { TeletextGrid } from './TeletextGrid';
import { GridLine } from './GridLine';
import { HeaderTicker } from './HeaderTicker';
import { FastTextBar } from './FastTextBar';
import { GRID_MODES, type GridModeName } from '../display/gridModes';
import { layoutBody } from '../display/layout';
import { rowFromData, textRow } from '../display/rows';
import { SIDEBAR_ROWS } from '../display/sidebar';
import { getPageData } from '../utils/pageRegistry';

interface ScreenProps {
  mode: GridModeName;
  page: number;
  showCells: boolean;
}

/** A full screen at a fixed font size, so each mode can be compared side by side. */
const Screen = ({ mode: name, page, showCells }: ScreenProps) => {
  const mode = GRID_MODES[name];
  const data = getPageData(page)!;
  return (
    <div style={{ fontSize: 20 }} className={showCells ? 'tt-story-cells' : undefined}>
      <TeletextGrid cols={mode.cols} rows={mode.rows}>
        <HeaderTicker bufferText={`P${page}`} currentPage={page} cols={mode.cols} />
        {layoutBody(mode, data.mainRows.map(rowFromData), SIDEBAR_ROWS).map(({ key, ...line }) => (
          <GridLine key={key} {...line} />
        ))}
        <FastTextBar links={data.fastText} onNavigate={fn()} cols={mode.cols} row={mode.rows} />
      </TeletextGrid>
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
  args: { mode: 'classic', page: 100, showCells: false },
  argTypes: {
    mode: { control: 'inline-radio', options: Object.keys(GRID_MODES) },
    page: { control: 'select', options: [100, 101, 200, 201, 300, 400] },
  },
};

export default meta;
type Story = StoryObj<typeof Screen>;

export const Widescreen: Story = { args: { mode: 'widescreen' } };
export const Classic: Story = {};
export const Portrait: Story = { args: { mode: 'portrait' } };
export const CellOverlay: Story = { args: { showCells: true } };

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
