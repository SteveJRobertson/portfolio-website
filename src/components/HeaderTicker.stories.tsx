import type { Meta, StoryObj } from '@storybook/react-vite';
import { HeaderTicker } from './HeaderTicker';

const meta: Meta<typeof HeaderTicker> = {
  title: 'Molecules/HeaderTicker',
  component: HeaderTicker,
  args: { bufferText: 'P100', currentPage: 100 },
  decorators: [
    (Story) => (
      <div style={{ background: 'var(--tt-black)', padding: '1rem', fontFamily: 'var(--tt-font)', fontSize: 24, width: '40ch', whiteSpace: 'pre' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof HeaderTicker>;

export const Idle: Story = {};
export const TypingPageNumber: Story = { args: { bufferText: 'P30-' } };
