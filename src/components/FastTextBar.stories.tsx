import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { FastTextBar } from './FastTextBar';
import { TeletextGrid } from './TeletextGrid';

const meta: Meta<typeof FastTextBar> = {
  title: 'Molecules/FastTextBar',
  component: FastTextBar,
  args: {
    onNavigate: fn(),
    cols: 40,
    row: 1,
    links: {
      red: { label: 'About [101]', page: 101, path: '/101', color: 'red' },
      green: { label: 'Projects [200]', page: 200, path: '/200', color: 'green' },
      yellow: { label: 'Skills [300]', page: 300, path: '/300', color: 'yellow' },
      cyan: { label: 'Contact [400]', page: 400, path: '/400', color: 'cyan' },
    },
  },
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
type Story = StoryObj<typeof FastTextBar>;

export const Classic: Story = {};
export const Widescreen: Story = { args: { cols: 56 } };
export const Portrait: Story = { args: { cols: 20 } };
