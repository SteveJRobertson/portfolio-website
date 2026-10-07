import { describe, expect, it } from 'vitest';
import { prerender } from './prerender';

describe('prerender: Flummox! link previews (SPEC §6)', () => {
  const pages = prerender();
  const byFile = (file: string) => pages.find((p) => p.file === file)!;

  it('gives page 152 its own picture, and every other page the site picture', () => {
    expect(byFile('152/index.html').image?.path).toBe('share/flummox.png');
    expect(byFile('101/index.html').image).toBeUndefined();
  });

  it('writes a score page for each score, pointing search engines at 152', () => {
    const scores = pages.filter((p) => p.file.startsWith('152/score/'));
    expect(scores.map((p) => p.href)).toEqual(Array.from({ length: 13 }, (_, i) => `/152/score/${i}/`));
    expect(byFile('152/score/9/index.html')).toMatchObject({
      title: 'I scored 9/12 on Flummox! | Steve Robertson',
      description: 'Felix is impressed. Nearly perfect. Can you flummox Felix?',
      canonical: '/152/',
      noindex: true,
      image: { path: 'share/flummox-9.png', alt: 'A Teletext screen: Flummox! score 9 out of 12, with Felix Flummox looking flummoxed.' },
    });
  });
});
