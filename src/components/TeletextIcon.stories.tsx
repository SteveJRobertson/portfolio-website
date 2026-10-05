import type { Meta, StoryObj } from '@storybook/react-vite';
import { TeletextIcon } from './TeletextIcon';
import { ICONS, ICON_NAMES } from '../icons/icons';
import { TELETEXT_COLORS } from '../types/teletext';

const meta: Meta<typeof TeletextIcon> = {
  title: 'Atoms/TeletextIcon',
  component: TeletextIcon,
  args: { name: 'linkedin', color: undefined },
  argTypes: {
    name: { control: 'select', options: ICON_NAMES },
    color: { control: 'select', options: [undefined, ...TELETEXT_COLORS.filter((c) => c !== 'black')] },
  },
  decorators: [
    (Story) => (
      <div style={{ background: 'var(--tt-black)', padding: '1.5rem', fontFamily: 'var(--tt-font)', fontSize: 32 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TeletextIcon>;

export const Single: Story = {};

/** Every icon in its own colours, and in one colour (a second colour is cut out). */
export const AllIcons: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, auto)', gap: '1em 1.5em' }}>
      {ICON_NAMES.map((name) => (
        <figure key={name} style={{ margin: 0, textAlign: 'center' }}>
          <TeletextIcon name={name} color={args.color} label="" />
          <figcaption className="c-white" style={{ fontSize: '0.5em', marginTop: '0.4em' }}>
            {ICONS[name].label}
          </figcaption>
        </figure>
      ))}
    </div>
  ),
};

export const OneColour: Story = { ...AllIcons, args: { color: 'yellow' } };

/** At the size they'd sit on a page, in a row of share buttons. */
export const ShareRow: Story = {
  render: () => (
    <div style={{ fontSize: 16, display: 'flex', gap: '0.6em' }}>
      {(['facebook', 'x', 'linkedin', 'bluesky', 'whatsapp', 'email', 'link'] as const).map((name) => (
        <TeletextIcon key={name} name={name} />
      ))}
    </div>
  ),
};
