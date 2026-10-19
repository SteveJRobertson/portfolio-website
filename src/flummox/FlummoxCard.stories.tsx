import type { Meta, StoryObj } from '@storybook/react-vite';
import { FlummoxCard } from './FlummoxCard';

/** The Flummox! link-preview pictures, as `npm run share-images` captures them. */
const meta: Meta<typeof FlummoxCard> = {
  title: 'Flummox/Card',
  component: FlummoxCard,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    card: { control: 'select', options: ['intro', ...Array.from({ length: 13 }, (_, i) => `score-${i}`)] },
  },
};
export default meta;

type Story = StoryObj<typeof FlummoxCard>;

export const Card: Story = { args: { card: 'score-9' } };
