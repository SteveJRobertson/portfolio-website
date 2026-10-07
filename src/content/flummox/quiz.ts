import type { SemanticBlock, TeletextColor } from '../../types/teletext.ts';
import { compileScreen, imageRenderer, type CompiledScreen, type ScreenHint } from '../compile.ts';
import { SLOT_WIDTHS, parseMarkup } from '../markup.ts';
import { sextant, type RgbaImage } from '../mosaic.ts';
import type { RowSource, TextRowSource } from '../schema.ts';
import type { CompiledQuiz, QuizQuestionSource, QuizSource } from './types.ts';

/** Exactly this many questions a game (SPEC §5). */
export const QUESTION_COUNT = 12;

/** The longest answer: one portrait line after the margin, the colour block and a space. */
export const MAX_ANSWER_LENGTH = 28;

export const ANSWER_COLORS: readonly TeletextColor[] = ['red', 'green', 'yellow', 'cyan'];

const QUIZ_KEYS = ['edition', 'checkpoints', 'share', 'verdicts', 'questions'];
const QUESTION_KEYS = ['question', 'answers', 'correct', 'quip'];
const VERDICT_KEYS = ['min', 'text'];

/** Felix's line after a right answer, when the question has no `quip`. */
const STOCK_QUIPS = ['Right! Felix is impressed.', 'Correct! Felix nods slowly.', 'Spot on! Felix makes a note.'];

const FELIX_ALT = 'Felix Flummox, the quizmaster: a cartoon with green hair, cyan glasses and a red bow tie.';
const FELIX_FLUMMOXED_ALT = 'Felix Flummox, the quizmaster, gone yellow in the face and looking flummoxed.';

/** The logo in chunky yellow mosaic letters, as Bamboozle! had. */
const LOGO: RowSource = { image: 'flummox-logo', alt: 'Flummox!', rows: 3, pixelArt: true };

/** A red line across the screen, between the parts of a page. */
const RULE = '{red}{rule}{/}';

const NBSP = '\u00a0';

/** The middle third of a cell, as `{rule}` draws. */
const BAR = sextant(0b001100);

/** Felix's cells across, and so the room left for his speech bubble beside him. */
const FELIX_COLS = 12;

interface Width {
  cols: number;
  /** The speech bubble's width beside Felix: the text column less its margin. */
  bubble: number;
}

const WIDE: Width = { cols: 38, bubble: 38 - FELIX_COLS - 2 };
const NARROW: Width = { cols: 32, bubble: 32 - FELIX_COLS - 2 };

/** How many cells some markup takes on screen: a slot its width, `{{` one cell, other tags none. */
const cellsOf = (markup: string): number =>
  Array.from(markup.replace(/\{slot:(\w+)\}/g, (_, name: string) => 'x'.repeat(SLOT_WIDTHS[name] ?? 0)).replace(/\{\{/g, '{').replace(/\{[^{}]*\}/g, '')).length;

/** Greedy word wrap of markup into lines of at most `width` cells. */
const wrapWords = (markup: string, width: number): string[] => {
  const lines: string[] = [];
  let line = '';
  for (const word of markup.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && cellsOf(next) > width) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
};

/** Plain text from a question's markup, safe to put back into markup. */
const plain = (markup: string): string => parseMarkup(markup).segments.map((seg) => seg.text).join('').replace(/\{/g, '{{');

/**
 * Felix's speech bubble: blue words on a white box `width` cells wide, then
 * a white tail stepping down towards him, as Bamboozle! drew its quizmaster's.
 */
const bubble = (markup: string, width: number): TextRowSource[] => {
  const inner = width - 2;
  const lines = wrapWords(markup, inner).map((line): TextRowSource => {
    const text = line.replace(/ /g, NBSP);
    return { text: `{bg:white}{blue}${NBSP}${text}${NBSP.repeat(inner - cellsOf(line) + 1)}{/}{/}`, screenOnly: true };
  });
  const tail = `${sextant(0b000011).repeat(3)}${sextant(0b001100).repeat(2)}${sextant(0b110000).repeat(2)}`;
  return [...lines, { text: `${' '.repeat(width - 7)}{white}${tail}{/}`, screenOnly: true }];
};

/** Felix at the right edge, speaking. */
const felix = (says: string, width: Width, flummoxed = false): RowSource => ({
  image: flummoxed ? 'felix-flummoxed' : 'felix',
  alt: flummoxed ? FELIX_FLUMMOXED_ALT : FELIX_ALT,
  rows: 9,
  pixelArt: true,
  align: 'right',
  beside: bubble(says, width.bubble),
});

/** A line centred across the screen (less the margin), double height if `big`. */
const centredText = (markup: string, width: Width): string =>
  `${' '.repeat(Math.max(0, Math.floor((width.cols - 1 - cellsOf(markup)) / 2)))}${markup}`;
const centred = (markup: string, width: Width, big = false): TextRowSource => ({
  text: centredText(markup, width),
  screenOnly: true,
  ...(big ? { doubleHeight: true } : {}),
});

/** A bar of colour across the bottom with the words in white, as Bamboozle! signed off its pages. */
const bar = (markup: string, bg: TeletextColor, width: Width): string => {
  const room = width.cols - 1;
  const before = Math.floor((room - cellsOf(markup)) / 2);
  return `{bg:${bg}}{white}${NBSP.repeat(before)}${markup.replace(/ /g, NBSP)}${NBSP.repeat(room - before - cellsOf(markup))}{/}{/}`;
};

/** The red line with the score set into its right end, like Ceefax's "1/26". */
const scoreRule = (width: Width): string => `{red}${BAR.repeat(width.cols - 1 - 11)}{/} {white}SCORE{/} {yellow}{slot:score}{/} {red}${BAR}{/}`;

const paragraph = (text: string): SemanticBlock => ({ kind: 'paragraph', content: [{ text }] });
const heading = (text: string): SemanticBlock => ({ kind: 'heading', content: [{ text }] });
const scoreParagraph: SemanticBlock = { kind: 'paragraph', content: [{ text: 'Score: ' }, { text: '', slot: 'score' }] };


const isText = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';

const unknownKeys = (value: object, allowed: string[]) => Object.keys(value).filter((k) => !allowed.includes(k));

/** Checks the shape of `quiz.json` (SPEC §7, rules 1, 2, 3, 5 and 6), returning the problems found. */
export const quizErrors = (data: unknown): string[] => {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return ['is not a JSON object'];
  const quiz = data as Record<string, unknown>;
  const errors: string[] = unknownKeys(quiz, QUIZ_KEYS).map((k) => `unknown key "${k}"; the keys are ${QUIZ_KEYS.join(', ')}`);

  if (!isText(quiz.edition)) errors.push('"edition" must name this set of questions');
  if (!isText(quiz.share) || !quiz.share.includes('{score}')) errors.push('"share" must be the shared message, with {score} where the score goes');

  const questions = quiz.questions;
  if (!Array.isArray(questions) || questions.length !== QUESTION_COUNT) {
    errors.push(`"questions" must list exactly ${QUESTION_COUNT} questions`);
  }

  const checkpoints = quiz.checkpoints;
  if (
    !Array.isArray(checkpoints) ||
    !checkpoints.every((c, i) => Number.isInteger(c) && c >= 1 && c < QUESTION_COUNT && (i === 0 || c > checkpoints[i - 1]))
  ) {
    errors.push(`"checkpoints" must be question numbers between 1 and ${QUESTION_COUNT - 1}, in order`);
  }

  const verdicts = quiz.verdicts;
  if (!Array.isArray(verdicts) || verdicts.length === 0) {
    errors.push('"verdicts" must list at least one { "min": N, "text": "…" }');
  } else {
    verdicts.forEach((v, i) => {
      const where = `verdict ${i + 1}`;
      if (typeof v !== 'object' || v === null) return errors.push(`${where} must be { "min": N, "text": "…" }`);
      errors.push(...unknownKeys(v, VERDICT_KEYS).map((k) => `${where}: unknown key "${k}"`));
      const { min, text } = v as Record<string, unknown>;
      if (!Number.isInteger(min) || (min as number) < 0 || (min as number) > QUESTION_COUNT) {
        errors.push(`${where}: "min" must be a score from 0 to ${QUESTION_COUNT}`);
      }
      if (!isText(text)) errors.push(`${where}: "text" is required`);
    });
    const mins = verdicts.map((v) => (v as { min?: unknown })?.min);
    if (!mins.includes(0)) errors.push('"verdicts" must have one with "min": 0, so every score gets a verdict');
    if (new Set(mins).size !== mins.length) errors.push('two verdicts have the same "min"');
  }

  (Array.isArray(questions) ? questions : []).forEach((q, i) => {
    const where = `question ${i + 1}`;
    if (typeof q !== 'object' || q === null) return errors.push(`${where} must be an object`);
    errors.push(...unknownKeys(q, QUESTION_KEYS).map((k) => `${where}: unknown key "${k}"; the keys are ${QUESTION_KEYS.join(', ')}`));
    const { question, answers, correct, quip } = q as Record<string, unknown>;
    if (!isText(question)) errors.push(`${where}: "question" is required`);
    else if (parseMarkup(question).links.length) errors.push(`${where}: the question can't link to a page`);
    if (quip !== undefined && !isText(quip)) errors.push(`${where}: "quip" must be some text`);
    if (!Array.isArray(answers) || answers.length !== 4 || !answers.every(isText)) {
      errors.push(`${where}: "answers" must be four answers (red, green, yellow, cyan)`);
    } else {
      answers.forEach((a: string, n) => {
        if (a.includes('{')) errors.push(`${where}: answer ${n + 1} ("${a}") must be plain text`);
        if (Array.from(a).length > MAX_ANSWER_LENGTH) {
          errors.push(`${where}: answer ${n + 1} ("${a}") is ${Array.from(a).length} characters; the limit is ${MAX_ANSWER_LENGTH}`);
        }
      });
      if (new Set(answers.map((a: string) => a.trim().toLowerCase())).size !== 4) errors.push(`${where}: two answers are the same`);
    }
    if (!Number.isInteger(correct) || (correct as number) < 0 || (correct as number) > 3) {
      errors.push(`${where}: "correct" must be 0 (red) to 3 (cyan)`);
    }
  });

  return errors;
};

/**
 * A question's four answers, as Bamboozle! set them: a solid block of the
 * key's colour, then the answer in white, double height, a row between each.
 * Kept out of the mirror, which has buttons. Portrait's block is a cell narrower.
 */
const answerRows = (answers: string[], width: Width): TextRowSource[] =>
  answers.flatMap((answer, i): TextRowSource[] => {
    const block = NBSP.repeat(width === WIDE ? 3 : 2);
    const gap = width === WIDE ? '  ' : ' ';
    const row: TextRowSource = {
      text: `{answer:${i}}{bg:${ANSWER_COLORS[i]}}${block}{/}${gap}{white}${answer.replace(/\{/g, '{{')}{/}{/}`,
      doubleHeight: true,
      screenOnly: true,
    };
    return i < answers.length - 1 ? [row, ''] : [row];
  });

const stageOf = (stages: number[], question: number) => stages.filter((s) => s <= question).at(-1) ?? 0;

interface ScreenSource {
  rows: RowSource[];
  narrowRows: RowSource[];
  hint: ScreenHint;
  semantic: SemanticBlock[];
}

/** The same screen at both widths, which differ only in where the words wrap. */
const both = (rows: (w: Width) => RowSource[], hint: (w: Width) => string, semantic: SemanticBlock[], gap = true): ScreenSource => ({
  rows: rows(WIDE),
  narrowRows: rows(NARROW),
  hint: { wide: hint(WIDE), narrow: hint(NARROW), gap },
  semantic,
});

const ANY_COLOUR = (w: Width) => centredText('{cyan}PRESS ANY COLOUR TO CONTINUE{/}', w);

/** Every screen of the game, in the style of Bamboozle!'s pages (SPEC §4). */
const screens = (quiz: QuizSource) => {
  const total = quiz.questions.length;
  const stages = [0, ...quiz.checkpoints];
  const checkpointText = quiz.checkpoints.join(' or ');
  const introText = `Our resident quizmaster, {yellow}Felix Flummox{/}, will pose ${total} questions. Press the coloured key for your answer. Get one wrong and it's back to the last checkpoint, after question ${checkpointText}.`;
  const introAsk = `{yellow}Can you get all ${total} first time?{/}`;
  const introSemantic = (says: string): SemanticBlock[] => [
    paragraph(parseMarkup(introText).segments.map((seg) => seg.text).join('')),
    paragraph(`Can you get all ${total} first time?`),
    { kind: 'image', alt: FELIX_ALT },
    paragraph(says),
  ];

  return {
    stages,
    intro: both(
      (w) => [LOGO, RULE, introText, introAsk, felix('Hello! Welcome to page 152. Your best so far: {slot:best}. Press red to begin.', w)],
      (w) => bar('Press red to begin', 'red', w),
      [...introSemantic('Hello! Welcome to page 152. Your best so far:'), { kind: 'paragraph', content: [{ text: '', slot: 'best' }] }],
    ),
    introResume: both(
      (w) => [LOGO, RULE, introText, introAsk, felix('Welcome back! You were on question {slot:resume}. Press red to carry on, or green to start again.', w)],
      (w) => bar('Press red to carry on', 'red', w),
      [
        ...introSemantic('Welcome back! You were on question'),
        { kind: 'paragraph', content: [{ text: '', slot: 'resume' }] },
        paragraph('Press red to carry on, or green to start again.'),
      ],
    ),
    question: (q: QuizQuestionSource, i: number): ScreenSource =>
      both(
        (w) => [felix(`Question ${i + 1}. ${plain(q.question)}`, w), scoreRule(w), ...answerRows(q.answers, w)],
        (w) => bar('Press the colour of your choice', 'blue', w),
        [
          heading(`Question ${i + 1} of ${total}`),
          scoreParagraph,
          { kind: 'image', alt: FELIX_ALT },
          paragraph(parseMarkup(q.question).segments.map((seg) => seg.text).join('')),
        ],
        false,
      ),
    correct: (q: QuizQuestionSource, i: number): ScreenSource => {
      const says = plain(q.quip ?? STOCK_QUIPS[i % STOCK_QUIPS.length]);
      return both(
        (w) => [LOGO, RULE, felix(`${says} {slot:point}`, w), RULE, centred('{green}CORRECT!{/}', w, true), '', centred('{yellow}SCORE {slot:score}{/}', w, true)],
        ANY_COLOUR,
        [
          heading('Correct!'),
          { kind: 'image', alt: FELIX_ALT },
          paragraph(says.replace(/\{\{/g, '{')),
          { kind: 'paragraph', content: [{ text: '', slot: 'point' }] },
          scoreParagraph,
        ],
      );
    },
    flummoxed: (stage: number): ScreenSource => {
      const says = `That's not the answer! Back you go to question ${stage + 1}.`;
      return both(
        (w) => [LOGO, RULE, felix(says, w, true), RULE, centred('{white}BAD LUCK{/}', w, true), '', centred("{yellow}YOU'VE BEEN FLUMMOXED!{/}", w, true)],
        ANY_COLOUR,
        [heading("Bad luck! You've been flummoxed!"), { kind: 'image', alt: FELIX_FLUMMOXED_ALT }, paragraph(says), scoreParagraph],
      );
    },
    checkpoint: (stage: number): ScreenSource => {
      const says = `Well done! You're safe now: get one wrong and you only go back to question ${stage + 1}.`;
      return both(
        (w) => [LOGO, RULE, felix(says, w), RULE, centred('{green}CHECKPOINT!{/}', w, true), '', centred('{yellow}SCORE {slot:score}{/}', w, true)],
        ANY_COLOUR,
        [heading('Checkpoint!'), { kind: 'image', alt: FELIX_ALT }, paragraph(says), scoreParagraph],
      );
    },
    finished: (verdict: string, min: number): ScreenSource => {
      const says = `Well done! You got {slot:score} of ${total} right first time. ${verdict}`;
      return both(
        (w) => [LOGO, RULE, felix(says, w, min >= 9), RULE, centred(`{white}SCORE{/} {yellow}{slot:score}{/} {white}OF ${total}{/}`, w, true), '', centred('{green}{slot:newbest}{/}', w, true)],
        (w) => bar('Press red to play again', 'red', w),
        [
          heading('You beat Felix!'),
          { kind: 'image', alt: min >= 9 ? FELIX_FLUMMOXED_ALT : FELIX_ALT },
          { kind: 'paragraph', content: [{ text: 'You got ' }, { text: '', slot: 'score' }, { text: ` of ${total} right first time.` }] },
          paragraph(parseMarkup(verdict).segments.map((seg) => seg.text).join('')),
          { kind: 'paragraph', content: [{ text: '', slot: 'newbest' }] },
        ],
      );
    },
  };
};

/**
 * Checks `quiz.json` and lays out every screen of the game for both widths
 * (SPEC §7). Any screen that doesn't fit the grid is an error naming it.
 */
export const compileQuiz = (data: unknown, images: Readonly<Record<string, RgbaImage>>): { quiz?: CompiledQuiz; errors: string[] } => {
  const shape = quizErrors(data);
  if (shape.length) return { errors: shape.map((e) => `quiz.json: ${e}`) };
  const source = data as QuizSource;
  const renderImage = imageRenderer(images);
  const errors: string[] = [];
  const build = (where: string, screen: ScreenSource): CompiledScreen => {
    const compiled = compileScreen(screen.rows, `quiz.json ${where}`, renderImage, screen.hint, screen.narrowRows);
    errors.push(...compiled.errors);
    if (compiled.links.length) errors.push(`quiz.json ${where}: can't link to pages`);
    return { wide: compiled.wide, narrow: compiled.narrow, semantic: screen.semantic ?? compiled.semantic };
  };

  const s = screens(source);
  const quiz: CompiledQuiz = {
    edition: source.edition,
    stages: s.stages,
    share: source.share,
    questions: source.questions.map((q, i) => ({
      question: parseMarkup(q.question).segments.map((seg) => seg.text).join(''),
      answers: q.answers,
      correct: q.correct,
      screen: build(`question ${i + 1}`, s.question(q, i)),
      correctScreen: build(`question ${i + 1} (correct)`, s.correct(q, i)),
    })),
    intro: build('intro', s.intro),
    introResume: build('intro (carry on)', s.introResume),
    flummoxed: s.stages.map((stage) => build(`flummoxed (back to ${stage + 1})`, s.flummoxed(stage))),
    checkpoint: s.stages.slice(1).map((stage) => build(`checkpoint (${stage + 1})`, s.checkpoint(stage))),
    finished: [...source.verdicts]
      .sort((a, b) => b.min - a.min)
      .map((v) => ({ min: v.min, text: v.text, screen: build(`finished (${v.min}+)`, s.finished(v.text, v.min)) })),
  };
  return errors.length ? { errors } : { quiz, errors };
};

/** The stage (index of its first question) that question `i` belongs to. */
export const stageFor = (stages: number[], i: number): number => stageOf(stages, i);
