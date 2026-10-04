import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { HoldButton } from './HoldButton';

/** HOLD, in the strip under the screen on pages with sub-pages. */
const meta: Meta<typeof HoldButton> = {
  title: 'Atoms/HoldButton',
  component: HoldButton,
  args: { held: false, onToggle: fn() },
  decorators: [
    (Story) => (
      <div className="control-strip">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof HoldButton>;

export const Cycling: Story = {};
export const Held: Story = { args: { held: true } };
