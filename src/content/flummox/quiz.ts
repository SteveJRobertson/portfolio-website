import type { SemanticBlock, TeletextColor } from '../../types/teletext.ts';
import { compileScreen, imageRenderer, type CompiledScreen } from '../compile.ts';
import { parseMarkup } from '../markup.ts';
import type { RgbaImage } from '../mosaic.ts';
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

const BANNER: RowSource = { banner: 'FLUMMOX!', bg: 'red' };

const FELIX_ALT = 'Felix Flummox, the quizmaster: a cartoon with green hair, cyan glasses and a red bow tie.';
const FELIX_FLUMMOXED_ALT = 'Felix Flummox, the quizmaster, gone yellow in the face and looking flummoxed.';

const felix = (beside: TextRowSource[], flummoxed = false): RowSource => ({
  image: flummoxed ? 'felix-flummoxed' : 'felix',
  alt: flummoxed ? FELIX_FLUMMOXED_ALT : FELIX_ALT,
  rows: 9,
  pixelArt: true,
  beside,
});

const smallFelix = (beside: TextRowSource[]): RowSource => ({ image: 'felix-small', alt: FELIX_ALT, rows: 6, pixelArt: true, beside });

const two = (n: number) => String(n).padStart(2, '0');

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

/** A question's four answer lines, each a block of its key's colour then the answer in that colour. Kept out of the mirror, which has buttons. */
const answerRows = (answers: string[]): RowSource[] =>
  answers.map((answer, i) => {
    const color = ANSWER_COLORS[i];
    return { text: `{answer:${i}}{bg:${color}}\u00a0{/} {${color}}${answer.replace(/\{/g, '{{')}{/}{/}`, screenOnly: true };
  });

const stageOf = (stages: number[], question: number) => stages.filter((s) => s <= question).at(-1) ?? 0;

/** Every screen of the game as source rows, with the mirror where it differs from the default (SPEC §4). */
const screens = (quiz: QuizSource) => {
  const total = quiz.questions.length;
  const stages = [0, ...quiz.checkpoints];
  const checkpointText = quiz.checkpoints.join(' or ');
  const introBeside: TextRowSource[] = [
    `{yellow}Felix Flummox{/}, your quizmaster, has ${total} questions for you.`,
    '',
    'Press the coloured button for your answer.',
    '',
    'A point for each one right first time.',
  ];
  const introRules = (resume: boolean): RowSource[] => [
    '',
    `Get one wrong and you're {yellow}FLUMMOXED!{/} Back you go to the last checkpoint, after question ${checkpointText}.`,
    '',
    resume ? '{cyan}Best score: {slot:best}{/}   {white}Now on: {slot:resume}{/}' : '{cyan}Best score: {slot:best}{/}',
  ];

  return {
    stages,
    intro: { rows: [BANNER, '', felix(introBeside), ...introRules(false)], hint: '{green}Press green to play.{/}' },
    introResume: { rows: [BANNER, '', felix(introBeside), ...introRules(true)], hint: '{green}Press green to carry on.{/}' },
    question: (q: QuizQuestionSource, i: number) => {
      const heading = `QUESTION ${two(i + 1)} OF ${total}`;
      const semantic: SemanticBlock[] = [
        { kind: 'heading', content: [{ text: `Question ${i + 1} of ${total}` }] },
        { kind: 'paragraph', content: [{ text: 'Score: ' }, { text: '', slot: 'score' }] },
        { kind: 'image', alt: FELIX_ALT },
        { kind: 'paragraph', content: [{ text: parseMarkup(q.question).segments.map((s) => s.text).join('') }] },
      ];
      return {
        rows: [BANNER, '', `{yellow}${heading}{/}   {cyan}SCORE {slot:score}{/}`, '', smallFelix([q.question]), '', ...answerRows(q.answers)],
        // Portrait has room to spare, so the answers get a row between them: bigger targets to tap.
        narrowRows: [
          BANNER,
          '',
          `{yellow}${heading}{/}   {cyan}SCORE {slot:score}{/}`,
          '',
          smallFelix([q.question]),
          '',
          ...answerRows(q.answers).flatMap((row) => [row, '']),
        ],
        hint: '{white}Press a colour to answer.{/}',
        semantic,
      };
    },
    correct: (q: QuizQuestionSource, i: number) => ({
      rows: [
        BANNER,
        '',
        felix([{ text: '{green}CORRECT!{/}', heading: true }, '', q.quip ?? STOCK_QUIPS[i % STOCK_QUIPS.length], '', '{yellow}{slot:point}{/}', '{cyan}SCORE {slot:score}{/}']),
      ],
      hint: '{green}Press green to go on.{/}',
    }),
    flummoxed: (stage: number) => ({
      rows: [
        BANNER,
        '',
        felix(
          [{ text: '{yellow}FLUMMOXED!{/}', heading: true }, '', 'Felix has got you this time.', '', `Back you go to question ${two(stage + 1)}.`, '', '{cyan}SCORE {slot:score}{/}'],
          true,
        ),
      ],
      hint: '{green}Press green to try again.{/}',
    }),
    checkpoint: (stage: number) => ({
      rows: [
        BANNER,
        '',
        felix([
          { text: '{green}CHECKPOINT!{/}', heading: true },
          '',
          `You're safe at question ${two(stage + 1)}. Get one wrong from here and you go back to ${two(stage + 1)}, not the start.`,
          '',
          '{cyan}SCORE {slot:score}{/}',
        ]),
      ],
      hint: '{green}Press green to go on.{/}',
    }),
    finished: (verdict: string, min: number) => ({
      rows: [
        BANNER,
        '',
        felix(
          [
            { text: '{green}YOU BEAT FELIX!{/}', heading: true },
            '',
            `You scored {slot:score} out of ${total}.`,
            '{yellow}{slot:newbest}{/}',
            '',
            verdict,
          ],
          min >= 9,
        ),
      ],
      hint: '{green}Press green to play again.{/}',
    }),
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
  const build = (
    where: string,
    screen: { rows: RowSource[]; narrowRows?: RowSource[]; hint?: string; semantic?: SemanticBlock[] },
  ): CompiledScreen => {
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
