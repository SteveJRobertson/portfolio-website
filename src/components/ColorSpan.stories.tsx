import type { Meta, StoryObj } from '@storybook/react-vite';
import { ColorSpan } from './ColorSpan';

const meta: Meta<typeof ColorSpan> = {
  title: 'Atoms/ColorSpan',
  component: ColorSpan,
  args: { children: 'STEVE-TEXT', color: 'yellow' },
  argTypes: {
    color: { control: 'select', options: ['white', 'yellow', 'cyan', 'green', 'magenta', 'red', 'blue', 'black'] },
    bg: { control: 'select', options: [undefined, 'white', 'yellow', 'cyan', 'green', 'magenta', 'red', 'blue', 'black'] },
  },
  decorators: [
    (Story) => (
      <div style={{ background: 'var(--tt-black)', padding: '1rem', fontFamily: 'var(--tt-font)', fontSize: 24, whiteSpace: 'pre' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ColorSpan>;

export const Foreground: Story = {};
export const WithBackground: Story = { args: { children: 'P100', color: 'white', bg: 'blue' } };
