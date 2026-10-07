import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { quiz } from './quizData';
import { TeletextGrid } from '../components/TeletextGrid';
import { GridLine } from '../components/GridLine';
import { HeaderTicker } from '../components/HeaderTicker';
import { FastTextBar } from '../components/FastTextBar';
import { ScanlineOverlay } from '../components/ScanlineOverlay';
import { GRID_MODES, type GridModeName } from '../display/gridModes';
import { layoutBody } from '../display/layout';
import { sidebarRows } from '../display/sidebar';
import { QUICK_INDEX, getPage } from '../content/registry';
import type { CompiledScreen } from '../content/compile';
import { fillSlots, twoDigits } from './slots';

const SIDEBAR_ROWS = sidebarRows(QUICK_INDEX);

const SCREENS = ['intro', 'intro (carry on)', 'question', 'correct', 'flummoxed', 'checkpoint', 'finished', 'share'] as const;
type ScreenName = (typeof SCREENS)[number];

interface FlummoxScreenProps {
  mode: GridModeName;
  screen: ScreenName;
  /** 1 to 12: which question (also picks the stage for flummoxed and checkpoint). */
  question: number;
  score: number;
  /** The CRT scanlines and glow (page 888). */
  crt?: boolean;
  fontSize?: number;
}

const pick = (screen: ScreenName, question: number, score: number): CompiledScreen => {
  const i = Math.min(Math.max(question, 1), quiz.questions.length) - 1;
  const stage = quiz.stages.filter((s) => s <= i).length - 1;
  switch (screen) {
    case 'intro':
      return quiz.intro;
    case 'intro (carry on)':
      return quiz.introResume;
    case 'question':
      return quiz.questions[i].screen;
    case 'correct':
      return quiz.questions[i].correctScreen;
    case 'flummoxed':
      return quiz.flummoxed[stage];
    case 'checkpoint':
      return quiz.checkpoint[Math.max(stage - 1, 0)];
    case 'finished':
      return quiz.finished.find((f) => score >= f.min)!.screen;
    case 'share':
      return quiz.share[score];
  }
};

/**
 * Every Flummox! screen (docs/flummox/SPEC.md §4), laid out from `quiz.json`
 * at build time, with its slots filled in as the game would.
 */
const FlummoxScreen = ({ mode: name, screen, question, score, crt = false, fontSize = 20 }: FlummoxScreenProps) => {
  const mode = GRID_MODES[name];
  const compiled = pick(screen, question, score);
  const stage = quiz.stages.filter((s) => s < question).at(-1) ?? 0;
  const rows = fillSlots(name === 'portrait' ? compiled.narrow : compiled.wide, {
    score: twoDigits(score),
    best: twoDigits(Math.max(score, 9)),
    resume: twoDigits(stage + 1),
    point: '+1 POINT',
    newbest: 'NEW BEST!',
  });
  return (
    <div style={{ fontSize, position: 'relative' }} className={crt ? 'teletext-screen--crt' : undefined}>
      <TeletextGrid cols={mode.cols} rows={mode.rows}>
        <HeaderTicker bufferText="P152" currentPage={152} cols={mode.cols} />
        {layoutBody(mode, rows, SIDEBAR_ROWS).map(({ key, ...line }) => (
          <GridLine key={key} {...line} />
        ))}
        <FastTextBar links={getPage(152)!.fastext} onNavigate={fn()} cols={mode.cols} row={mode.rows} />
      </TeletextGrid>
      {crt && <ScanlineOverlay />}
    </div>
  );
};

const meta: Meta<typeof FlummoxScreen> = {
  title: 'Flummox/Screens',
  component: FlummoxScreen,
  args: { mode: 'classic', screen: 'question', question: 3, score: 2 },
  argTypes: {
    mode: { control: 'inline-radio', options: Object.keys(GRID_MODES) },
    screen: { control: 'select', options: SCREENS },
    question: { control: { type: 'number', min: 1, max: 12 } },
    score: { control: { type: 'number', min: 0, max: 12 } },
    crt: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof FlummoxScreen>;

export const Intro: Story = { args: { screen: 'intro' } };
export const IntroCarryOn: Story = { args: { screen: 'intro (carry on)', question: 6 } };
export const Question: Story = {};
export const QuestionPortrait: Story = { args: { mode: 'portrait', fontSize: 14 } };
export const QuestionWidescreen: Story = { args: { mode: 'widescreen' } };
export const Correct: Story = { args: { screen: 'correct', question: 1, score: 1 } };
export const Flummoxed: Story = { args: { screen: 'flummoxed', question: 6, score: 4 } };
export const Checkpoint: Story = { args: { screen: 'checkpoint', question: 5, score: 4 } };
export const Finished: Story = { args: { screen: 'finished', score: 10 } };
export const FinishedPerfect: Story = { args: { screen: 'finished', score: 12 } };
export const Share: Story = { args: { screen: 'share', score: 9 } };
/** With the CRT effect from page 888: dark text on light cells gets no glow, so the speech bubble stays sharp. */
export const IntroCrt: Story = { args: { screen: 'intro', crt: true } };
