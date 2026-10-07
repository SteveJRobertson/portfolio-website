import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { compileQuizFile } from './pageFiles.ts';

/** Where the link-preview pictures live, with the manifest recording what they were made from. */
export const SHARE_DIR = path.resolve(import.meta.dirname, '../../public/share');
export const MANIFEST = path.join(SHARE_DIR, 'manifest.json');
const CARD_COMPONENT = path.resolve(import.meta.dirname, '../../src/flummox/FlummoxCard.tsx');

/** The cards to make: page 152's own (`flummox.png`) and one per score (`flummox-N.png`). */
export const shareCards = (): { card: string; file: string }[] => {
  const { quiz } = compileQuizFile();
  if (!quiz) throw new Error('quiz.json does not compile: run npm run validate');
  return [{ card: 'intro', file: 'flummox.png' }, ...quiz.cards.scores.map((_, i) => ({ card: `score-${i}`, file: `flummox-${i}.png` }))];
};

/**
 * A hash of everything the pictures are drawn from: the laid-out cards (the
 * verdicts, Felix's pictures, the layout) and the card component. When it
 * changes, the pictures are out of date.
 */
export const shareCardsHash = (): string => {
  const { quiz } = compileQuizFile();
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(quiz?.cards))
    .update(fs.readFileSync(CARD_COMPONENT))
    .digest('hex');
};
