import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { cardSets, shareCards, shareCardsHash } from './shareCards.ts';

describe('Flummox! share pictures (SPEC §6)', () => {
  it.each(cardSets().map((set) => [set.special ?? 'regular', set] as const))('%s: are up to date with the cards they are drawn from', (_, set) => {
    const { hash } = JSON.parse(fs.readFileSync(set.manifest, 'utf-8')) as { hash: string };
    expect(hash, 'The Flummox! cards have changed: run the "Update share images" workflow on this branch (or put [update share images] in a commit message)').toBe(shareCardsHash(set));
  });

  it.each(cardSets().map((set) => [set.special ?? 'regular', set] as const))('%s: are all there, 1200 × 630 and under 300 KB so WhatsApp shows them', (_, set) => {
    // A special also has its own picture of page 100 (share.png), for every other page's link preview
    const files = [...shareCards(set).map((c) => c.file), ...(set.special ? ['share.png'] : [])];
    for (const file of files) {
      const data = fs.readFileSync(path.join(set.dir, file));
      const { width, height } = PNG.sync.read(data);
      expect([file, width, height]).toEqual([file, 1200, 630]);
      expect(data.length, file).toBeLessThan(300 * 1024);
    }
  });
});
