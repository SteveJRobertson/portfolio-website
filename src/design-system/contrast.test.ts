import { describe, expect, it } from 'vitest';
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
});
