import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseMarkup } from '../content/markup';
import { contrastRatio } from './contrast';

describe('contrastRatio', () => {
  it('matches the WCAG reference values', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
  });

  it('keeps every foreground token at AA (4.5:1) on the #0C0C0C background', () => {
    ['#FFFFFF', '#FFFF00', '#00FFFF', '#00FF00', '#FF00FF', '#FF3333', '#4D79FF'].forEach((fg) => {
      expect(contrastRatio(fg, '#0C0C0C')).toBeGreaterThanOrEqual(4.5);
    });
  });

  it('keeps Text mode at AAA (7:1), since it is the high-contrast view', () => {
    const css = fs.readFileSync(path.join(__dirname, '../index.css'), 'utf-8');
    const block = css.slice(css.indexOf('.text-mode {'));
    const token = (name: string) => block.match(new RegExp(`--text-${name}: (#[0-9a-fA-F]{6})`))![1];
    ['fg', 'link', 'heading'].forEach((name) => {
      expect(contrastRatio(token(name), token('bg'))).toBeGreaterThanOrEqual(7);
    });
  });

  it('keeps the control strip readable at AA', () => {
    expect(contrastRatio('#00FF00', '#222222')).toBeGreaterThanOrEqual(4.5); // switch off
    expect(contrastRatio('#000000', '#00FF00')).toBeGreaterThanOrEqual(4.5); // switch on
  });

  it('keeps every page banner at 3:1, the minimum for large text', () => {
    const css = fs.readFileSync(path.join(__dirname, '../index.css'), 'utf-8');
    const colour = (name: string) => css.match(new RegExp(`--tt-${name}: (#[0-9a-fA-F]{6})`))![1];
    const pagesDir = path.join(__dirname, '../content/pages');
    const banners = fs
      .readdirSync(pagesDir)
      .flatMap((file) => JSON.stringify(JSON.parse(fs.readFileSync(path.join(pagesDir, file), 'utf-8'))).match(/\{"banner":"(?:[^"\\]|\\.)*","bg":"\w+"(?:,"rule":"\w+")?\}/g) ?? [])
      .map((json) => JSON.parse(json) as { banner: string; bg: string });
    expect(banners.length).toBeGreaterThan(10);
    for (const { banner, bg } of banners) {
      for (const segment of parseMarkup(banner).segments.filter((s) => s.text.trim())) {
        expect(contrastRatio(colour(segment.color ?? 'white'), colour(bg)), `${banner} on ${bg}`).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
