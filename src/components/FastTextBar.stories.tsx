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
    links: [
      { page: 101, label: 'ABOUT' },
      { page: 200, label: 'PROJECTS' },
      { page: 300, label: 'SKILLS' },
      { page: 400, label: 'CONTACT' },
    ],
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

/** Keyboard focus inverts the slot inside a white outline, so it never looks like hover. */
export const Focused: Story = {
  play: async ({ canvasElement }) => {
    canvasElement.querySelectorAll('a')[1]?.focus({ focusVisible: true } as FocusOptions);
  },
};
