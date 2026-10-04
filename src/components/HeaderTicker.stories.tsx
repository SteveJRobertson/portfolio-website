import type { Meta, StoryObj } from '@storybook/react-vite';
import { HeaderTicker } from './HeaderTicker';
import { TeletextGrid } from './TeletextGrid';

const meta: Meta<typeof HeaderTicker> = {
  title: 'Molecules/HeaderTicker',
  component: HeaderTicker,
  args: { bufferText: 'P100', currentPage: 100, cols: 40 },
  decorators: [
    (Story, { args }) => (
      <div style={{ fontSize: 24 }}>
        <TeletextGrid cols={args.cols} rows={1}>
          <Story />
        </TeletextGrid>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof HeaderTicker>;

export const Classic: Story = {};
export const Widescreen: Story = { args: { cols: 56 } };
export const Portrait: Story = { args: { cols: 20 } };
export const TypingPageNumber: Story = { args: { bufferText: 'P30-' } };
export const WithSubpages: Story = { args: { bufferText: 'P110', currentPage: 110, subpage: { index: 0, count: 6 } } };
