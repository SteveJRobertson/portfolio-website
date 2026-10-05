import type { Meta, StoryObj } from '@storybook/react-vite';
import { TeletextIcon } from './TeletextIcon';
import { ICONS, ICON_NAMES } from '../icons/icons';
import { TELETEXT_COLORS } from '../types/teletext';

const meta: Meta<typeof TeletextIcon> = {
  title: 'Atoms/TeletextIcon',
  component: TeletextIcon,
  args: { name: 'linkedin', color: undefined, size: 24 },
  argTypes: {
    name: { control: 'select', options: ICON_NAMES },
    color: { control: 'select', options: [undefined, ...TELETEXT_COLORS.filter((c) => c !== 'black')] },
    size: { control: { type: 'number', min: 12, step: 12 } },
  },
  decorators: [
    (Story) => (
      <div style={{ background: 'var(--tt-black)', padding: '1.5rem', fontFamily: 'var(--tt-font)', fontSize: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TeletextIcon>;

export const Single: Story = {};

/** Every icon at 24 × 24 px, in its own colours or one colour (a second colour is cut out). */
export const AllIcons: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, auto)', gap: '1.25em 2em' }}>
      {ICON_NAMES.map((name) => (
        <figure key={name} style={{ margin: 0, textAlign: 'center' }}>
          <TeletextIcon name={name} color={args.color} size={args.size} label="" />
          <figcaption className="c-white" style={{ marginTop: '0.5em' }}>
            {ICONS[name].label}
          </figcaption>
        </figure>
      ))}
    </div>
  ),
};

export const OneColour: Story = { ...AllIcons, args: { color: 'yellow' } };

/** Four times the size, to check the pixels. */
export const Enlarged: Story = { ...AllIcons, args: { size: 96 } };
