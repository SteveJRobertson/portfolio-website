import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SemanticPage } from './SemanticPage';
import { quiz } from '../flummox/quizData';
import { fillSemanticSlots } from '../flummox/slots';
import { FASTEXT_ORDER } from '../display/fastext';
import { SettingsControls } from './SettingsControls';
import { NAVIGABLE_PAGES, PAGES, getPage } from '../content/registry';

interface TextModeProps {
  page: number;
  /** Page 152 only: the game's buttons, as on a Flummox! question. */
  actions?: SemanticPageProps['actions'];
}

/** Text mode: the semantic mirror shown as the page (SPEC §9). Hidden behind the grid otherwise. */
const TextMode = ({ page, actions }: TextModeProps) => {
  const data = page === 152 && actions ? QUIZ_QUESTION : getPage(page)!;
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
        actions={actions}
      >
        {page === 888 && <SettingsControls settings={{ textMode: true, shortcuts: true, crt: null }} onChange={fn()} />}
      </SemanticPage>
    </div>
  );
};

type SemanticPageProps = React.ComponentProps<typeof SemanticPage>;

const FIRST = quiz.questions[0];
/** Page 152 as Text mode shows the first Flummox! question. */
const QUIZ_QUESTION = { ...getPage(152)!, semantic: [fillSemanticSlots(FIRST.screen.semantic, { score: '00' })] };

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
/** Flummox! in Text mode: the question, then its four answers as buttons (SPEC §9). */
export const FlummoxQuestion: Story = {
  args: {
    page: 152,
    actions: {
      label: 'Answers',
      items: FIRST.answers.map((text, i) => {
        const colour = FASTEXT_ORDER[i];
        return { name: `${colour[0].toUpperCase()}${colour.slice(1)}: ${text}`, text, color: colour, twin: `answer-${i}`, onPress: fn() };
      }),
    },
  },
};
