import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { MANIFEST, SHARE_DIR, shareCards, shareCardsHash } from './shareCards.ts';

describe('Flummox! share pictures (SPEC §6)', () => {
  it('are up to date with the cards they are drawn from', () => {
    const { hash } = JSON.parse(fs.readFileSync(MANIFEST, 'utf-8')) as { hash: string };
    expect(hash, 'The Flummox! cards have changed: run the "Update share images" workflow on this branch (or put [update share images] in a commit message)').toBe(shareCardsHash());
  });

  it('are all there, 1200 × 630 and under 300 KB so WhatsApp shows them', () => {
    for (const { file } of shareCards()) {
      const data = fs.readFileSync(path.join(SHARE_DIR, file));
      const { width, height } = PNG.sync.read(data);
      expect([file, width, height]).toEqual([file, 1200, 630]);
      expect(data.length, file).toBeLessThan(300 * 1024);
    }
  });
});
