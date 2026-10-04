import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SettingsControls } from './SettingsControls';

/** The page 888 switches, as shown in the strip under the screen. */
const meta: Meta<typeof SettingsControls> = {
  title: 'Molecules/SettingsControls',
  component: SettingsControls,
  args: { settings: { textMode: false, shortcuts: true, crt: null }, crtOn: true, onChange: fn() },
  decorators: [
    (Story) => (
      <div className="control-strip">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SettingsControls>;

export const Defaults: Story = {};
export const ShortcutsOff: Story = { args: { settings: { textMode: false, shortcuts: false, crt: null } } };
export const CrtOff: Story = { args: { settings: { textMode: false, shortcuts: true, crt: false }, crtOn: false } };
/** In Text mode the CRT switch is left out: Text mode never shows the effect. */
export const TextMode: Story = { args: { settings: { textMode: true, shortcuts: true, crt: null }, crtOn: undefined } };
