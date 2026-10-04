import type { Meta, StoryObj } from '@storybook/react-vite';
import { TeletextChar } from './TeletextChar';

const meta: Meta<typeof TeletextChar> = {
  title: 'Atoms/TeletextChar',
  component: TeletextChar,
  args: { char: 'A', color: 'cyan', doubleHeight: false },
  decorators: [
    (Story) => (
      <div style={{ background: 'var(--tt-black)', padding: '1rem 1rem 3rem', fontFamily: 'var(--tt-font)', fontSize: 48 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TeletextChar>;

export const Single: Story = {};
export const DoubleHeight: Story = { args: { doubleHeight: true } };
export const Mosaic: Story = { args: { char: '\u{1FB3B}', color: 'green' } };
