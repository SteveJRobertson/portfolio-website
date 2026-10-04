import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { MobileKeypad } from './MobileKeypad';
import { getPage } from '../content/registry';

const meta: Meta<typeof MobileKeypad> = {
  title: 'Molecules/MobileKeypad',
  component: MobileKeypad,
  args: {
    buffer: 'P1--',
    fastext: getPage(100)!.fastext,
    currentPage: 100,
    onDigit: fn(),
    onClear: fn(),
    onNavigate: fn(),
    onSubpage: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ paddingTop: 420 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MobileKeypad>;

export const Closed: Story = {};

/** Open, with the current page's Fastext on the colour buttons. */
export const Open: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'REMOTE' }));
    await expect(canvas.getByRole('group', { name: 'Remote handset' })).toBeVisible();
  },
};
