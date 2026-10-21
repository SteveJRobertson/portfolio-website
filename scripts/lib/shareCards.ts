import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { compileQuizFile, compileSpecialQuiz, readSpecialsDir } from './pageFiles.ts';
import type { CompiledQuiz } from '../../src/content/flummox/types.ts';

/** Where the link-preview pictures live, with the manifest recording what they were made from. */
export const SHARE_DIR = path.resolve(import.meta.dirname, '../../public/share');
export const MANIFEST = path.join(SHARE_DIR, 'manifest.json');
const CARD_COMPONENT = path.resolve(import.meta.dirname, '../../src/flummox/FlummoxCard.tsx');

/** A set of pictures: the regular ones in public/share/, or a dated special's in public/share/NAME/. */
export interface CardSet {
  special?: string;
  dir: string;
  manifest: string;
  cards: CompiledQuiz['cards'];
}

/** The regular set, then one per dated special (src/content/specials). */
export const cardSets = (): CardSet[] => {
  const { quiz } = compileQuizFile();
  if (!quiz) throw new Error('quiz.json does not compile: run npm run validate');
  const sets: CardSet[] = [{ dir: SHARE_DIR, manifest: MANIFEST, cards: quiz.cards }];
  for (const special of readSpecialsDir().specials) {
    const compiled = compileSpecialQuiz(special, quiz).quiz;
    if (!compiled) throw new Error(`specials/${special.name}.json does not compile: run npm run validate`);
    const dir = path.join(SHARE_DIR, special.name);
    sets.push({ special: special.name, dir, manifest: path.join(dir, 'manifest.json'), cards: compiled.cards });
  }
  return sets;
};

/** The cards to make in a set: page 152's own (`flummox.png`) and one per score (`flummox-N.png`). */
export const shareCards = (set: CardSet): { card: string; file: string }[] => [
  { card: 'intro', file: 'flummox.png' },
  ...set.cards.scores.map((_, i) => ({ card: `score-${i}`, file: `flummox-${i}.png` })),
];

/**
 * A hash of everything a set's pictures are drawn from: the laid-out cards
 * (the verdicts, Felix's pictures, the layout) and the card component. When
 * it changes, the pictures are out of date.
 */
export const shareCardsHash = (set: CardSet): string =>
  crypto.createHash('sha256').update(JSON.stringify(set.cards)).update(fs.readFileSync(CARD_COMPONENT)).digest('hex');
