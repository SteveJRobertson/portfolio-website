import type { Meta, StoryObj } from '@storybook/react-vite';
import { specialCards } from 'virtual:flummox-cards';
import { FlummoxCard } from './FlummoxCard';

/** The Flummox! link-preview pictures, as `npm run share-images` captures them. */
const meta: Meta<typeof FlummoxCard> = {
  title: 'Flummox/Card',
  component: FlummoxCard,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    card: { control: 'select', options: ['intro', ...Array.from({ length: 13 }, (_, i) => `score-${i}`)] },
    special: { control: 'select', options: [undefined, ...Object.keys(specialCards)] },
  },
};
export default meta;

type Story = StoryObj<typeof FlummoxCard>;

export const Card: Story = { args: { card: 'score-9' } };

/** A dated special's card, such as Halloween's. */
export const Special: Story = { args: { card: 'score-9', special: Object.keys(specialCards)[0] } };
