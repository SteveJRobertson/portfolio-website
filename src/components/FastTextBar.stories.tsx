import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { FastTextBar } from './FastTextBar';

const meta: Meta<typeof FastTextBar> = {
  title: 'Molecules/FastTextBar',
  component: FastTextBar,
  args: {
    onNavigate: fn(),
    links: {
      red: { label: 'About [101]', page: 101, path: '/101', color: 'red' },
      green: { label: 'Projects [200]', page: 200, path: '/200', color: 'green' },
      yellow: { label: 'Skills [300]', page: 300, path: '/300', color: 'yellow' },
      cyan: { label: 'Contact [400]', page: 400, path: '/400', color: 'cyan' },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ background: 'var(--tt-black)', padding: '1rem', fontFamily: 'var(--tt-font)', fontSize: 24, width: '40ch' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

export const Default: StoryObj<typeof FastTextBar> = {};
