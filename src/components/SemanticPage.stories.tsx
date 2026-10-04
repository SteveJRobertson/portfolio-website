import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SemanticPage } from './SemanticPage';
import { SettingsControls } from './SettingsControls';
import { NAVIGABLE_PAGES, PAGES, getPage } from '../content/registry';

interface TextModeProps {
  page: number;
}

/** Text mode: the semantic mirror shown as the page (SPEC §9). Hidden behind the grid otherwise. */
const TextMode = ({ page }: TextModeProps) => {
  const data = getPage(page)!;
  return (
    <div className="text-mode" style={{ position: 'static' }}>
      <header className="text-mode__bar">
        <span>
          STEEVEFAX <span className="c-cyan">P{page}</span>
        </span>
        <button type="button">TELETEXT VIEW</button>
      </header>
      <SemanticPage
        page={data}
        heading={data.title}
        headingRef={null}
        pages={PAGES.filter((p) => NAVIGABLE_PAGES.includes(p.page))}
        onNavigate={fn()}
        visible
      >
        {page === 888 && <SettingsControls settings={{ textMode: true, shortcuts: true, crt: null }} onChange={fn()} />}
      </SemanticPage>
    </div>
  );
};

const meta: Meta<typeof TextMode> = {
  title: 'Organisms/TextMode',
  component: TextMode,
  parameters: { layout: 'fullscreen' },
  args: { page: 100 },
  argTypes: { page: { control: 'select', options: PAGES.map((p) => p.page) } },
};

export default meta;
type Story = StoryObj<typeof TextMode>;

export const Index: Story = {};
export const Experience: Story = { args: { page: 110 } };
export const Projects: Story = { args: { page: 200 } };
export const Contact: Story = { args: { page: 400 } };
export const Accessibility: Story = { args: { page: 888 } };
