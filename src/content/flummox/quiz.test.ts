import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PNG } from 'pngjs';
import { IMAGES_DIR, QUIZ_FILE, compileQuizFile } from '../../../scripts/lib/pageFiles';
import { compileQuiz, quizErrors, MAX_ANSWER_LENGTH, QUESTION_COUNT } from './quiz';
import { parseMarkup } from '../markup';
import { layoutRows, slotsUsed } from '../wrap';
import { fillSemanticSlots, fillSlots, twoDigits } from '../../flummox/slots';
import type { QuizSource } from './types';
import type { GridRow } from '../../types/teletext';

const real = (): QuizSource => JSON.parse(fs.readFileSync(QUIZ_FILE, 'utf-8'));

const images = Object.fromEntries(
  ['felix', 'felix-flummoxed', 'flummox-logo'].map((name) => [name, PNG.sync.read(fs.readFileSync(`${IMAGES_DIR}/${name}.png`))]),
);

const with_ = (change: (quiz: QuizSource) => void): QuizSource => {
  const quiz = real();
  change(quiz);
  return quiz;
};

const text = (rows: GridRow[]) => rows.map((r) => r.segments.map((s) => s.text).join('').replace(/\u00a0/g, ' '));

describe('quiz.json', () => {
  it('compiles: every screen fits at 38 and 32 columns', () => {
    const { quiz, errors } = compileQuizFile();
    expect(errors).toEqual([]);
    expect(quiz!.questions).toHaveLength(QUESTION_COUNT);
    expect(quiz!.stages).toEqual([0, 4, 8]);
    expect(quiz!.flummoxed).toHaveLength(3);
    expect(quiz!.checkpoint).toHaveLength(2);
    expect(quiz!.finished.map((f) => f.min)).toEqual([12, 9, 5, 0]);
  });
});

describe('quizErrors (SPEC §7)', () => {
  it('accepts the real file', () => expect(quizErrors(real())).toEqual([]));

  it('rule 1: exactly 12 questions, and checkpoints between 1 and 11 in order', () => {
    expect(quizErrors(with_((q) => q.questions.pop()))).toContain('"questions" must list exactly 12 questions');
    expect(quizErrors(with_((q) => (q.checkpoints = [8, 4])))).toContain('"checkpoints" must be question numbers between 1 and 11, in order');
    expect(quizErrors(with_((q) => (q.checkpoints = [12])))).toContain('"checkpoints" must be question numbers between 1 and 11, in order');
  });

  it('rule 2: four different answers and a right one from 0 to 3', () => {
    expect(quizErrors(with_((q) => q.questions[0].answers.pop()))).toContain('question 1: "answers" must be four answers (red, green, yellow, cyan)');
    expect(quizErrors(with_((q) => (q.questions[1].answers[3] = 'ceefax')))).toContain('question 2: two answers are the same');
    expect(quizErrors(with_((q) => (q.questions[2].correct = 4)))).toContain('question 3: "correct" must be 0 (red) to 3 (cyan)');
  });

  it('rule 3: an answer fits one portrait line', () => {
    const long = 'x'.repeat(MAX_ANSWER_LENGTH + 1);
    expect(quizErrors(with_((q) => (q.questions[3].answers[0] = long)))).toContain(
      `question 4: answer 1 ("${long}") is 29 characters; the limit is 28`,
    );
  });

  it('rule 4: a screen that does not fit names the question', () => {
    const long = Array.from({ length: 60 }, () => 'flummoxed').join(' ');
    const { errors } = compileQuiz(with_((q) => (q.questions[5].question = long)), images);
    expect(errors.some((e) => e.startsWith('quiz.json question 6 (portrait): needs'))).toBe(true);
  });

  it('rule 5: a verdict for every score', () => {
    expect(quizErrors(with_((q) => q.verdicts.pop()))).toContain('"verdicts" must have one with "min": 0, so every score gets a verdict');
    expect(quizErrors(with_((q) => (q.verdicts[1].min = 12)))).toContain('two verdicts have the same "min"');
  });

  it('rule 6: unknown keys, links and tags in answers', () => {
    expect(quizErrors({ ...real(), extra: 1 })).toContain('unknown key "extra"; the keys are edition, checkpoints, share, verdicts, questions');
    expect(quizErrors(with_((q) => (q.questions[0].question = 'See {link:100}100{/}')))).toContain("question 1: the question can't link to a page");
    expect(quizErrors(with_((q) => (q.questions[0].answers[0] = '{red}Red{/}')))).toContain('question 1: answer 1 ("{red}Red{/}") must be plain text');
  });

  it('needs an edition and a share message with the score', () => {
    expect(quizErrors(with_((q) => (q.edition = '')))).toContain('"edition" must name this set of questions');
    expect(quizErrors(with_((q) => (q.share = 'Play Flummox!')))).toContain('"share" must be the shared message, with {score} where the score goes');
  });
});

describe('question screens', () => {
  const { quiz } = compileQuizFile();

  it('draws each answer as a block of its colour, then the answer, one line each', () => {
    const rows = quiz!.questions[0].screen.wide.filter((r) => r.segments.some((s) => s.answer !== undefined));
    expect(rows).toHaveLength(4);
    rows.forEach((row, i) => {
      const block = row.segments.find((s) => s.bg);
      expect(block).toMatchObject({ bg: ['red', 'green', 'yellow', 'cyan'][i], answer: i });
      expect(text([row])[0]).toContain(quiz!.questions[0].answers[i]);
    });
  });

  it('spaces the answers out in portrait, for bigger targets', () => {
    const narrow = quiz!.questions[0].screen.narrow;
    const at = narrow.flatMap((r, i) => (r.segments.some((s) => s.answer !== undefined) ? [i] : []));
    expect(at.slice(1).map((n, i) => n - at[i])).toEqual([2, 2, 2]);
  });

  it('puts the question in Felix\'s speech bubble, blue on white, with Felix at the right edge', () => {
    const [first] = quiz!.questions[0].screen.wide;
    expect(text([first])[0]).toMatch(/^ {2}Question 1\. /);
    expect(first.segments.find((s) => s.bg === 'white')).toMatchObject({ color: 'blue' });
    expect(Array.from(text([first])[0])).toHaveLength(38);
    expect(first.segments.at(-1)?.mosaic).toBe(true);
  });

  it('sets the score into the red line under the question', () => {
    const rule = quiz!.questions[0].screen.wide.find((r) => r.segments.some((s) => s.slot === 'score'));
    expect(text([rule!])[0]).toMatch(/SCORE {4}\S+$/u);
  });

  it('pins the hint bar to the last body row', () => {
    const last = quiz!.questions[0].screen.wide.at(-1)!;
    expect(text([last])[0]).toContain('Press the colour of your choice');
    expect(last.segments.find((s) => s.bg)).toMatchObject({ bg: 'blue' });
    expect(slotsUsed(quiz!.questions[0].screen.wide)).toBe(22);
    expect(slotsUsed(quiz!.questions[0].screen.narrow)).toBe(32);
  });

  it('keeps answers out of the mirror, which has a heading, the score and the question', () => {
    const blocks = quiz!.questions[0].screen.semantic;
    expect(blocks[0]).toEqual({ kind: 'heading', content: [{ text: 'Question 1 of 12' }] });
    expect(JSON.stringify(blocks)).not.toContain('BBC One');
    expect(fillSemanticSlots(blocks, { score: '3' })[1]).toEqual({ kind: 'paragraph', content: [{ text: 'Score: ' }, { text: '3' }] });
  });
});

describe('slots', () => {
  it('parses {slot:NAME} as a fixed-width space and rejects unknown names', () => {
    expect(parseMarkup('SCORE {slot:score}').segments.at(-1)).toMatchObject({ text: '  ', slot: 'score' });
    expect(parseMarkup('{slot:lives}').errors).toEqual(['unknown slot "lives"; the slots are score, best, resume, point, newbest']);
  });

  it('keeps a slot whole when wrapping', () => {
    const rows = layoutRows(['{cyan}SCORE {slot:score}{/}'], 32).rows;
    expect(rows[0].segments.find((s) => s.slot)).toMatchObject({ text: '  ', slot: 'score', color: 'cyan' });
  });

  it('fills a slot without changing its width', () => {
    const [row] = layoutRows(['{slot:point} done'], 32).rows;
    expect(text(fillSlots([row], { point: '+1 POINT' }))[0]).toBe(' +1 POINT done');
    expect(text(fillSlots([row], {}))[0]).toBe('          done');
    expect(text(fillSlots([row], { point: 'MUCH TOO LONG' }))[0]).toBe(' MUCH TOO done');
  });

  it('shows numbers as two digits', () => {
    expect(twoDigits(7)).toBe('07');
    expect(twoDigits(12)).toBe('12');
  });

  it('leaves a blank slot out of the mirror', () => {
    const blocks = fillSemanticSlots([{ kind: 'paragraph', content: [{ text: '', slot: 'newbest' }] }], {});
    expect(blocks).toEqual([]);
  });
});
