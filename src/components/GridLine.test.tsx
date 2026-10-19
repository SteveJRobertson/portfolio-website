import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GridLine } from './GridLine';
import type { GridRow } from '../types/teletext';

const directory: GridRow = {
  segments: [
    { text: ' ' },
    { text: 'Skills', color: 'white', link: 300 },
    { text: '....', color: 'white', link: 300, leaderDots: true },
    { text: '300', color: 'cyan', link: 300 },
  ],
};

describe('GridLine', () => {
  it('makes a directory line one link, from label to number', () => {
    const onLink = vi.fn();
    const { container } = render(<GridLine content={directory} row={2} width={20} onLink={onLink} />);
    const line = container.querySelector('.tt-line-link')!;
    expect(line.textContent).toBe('Skills....300');
    expect(container.querySelector('.tt-leader')?.textContent).toBe('....');
    fireEvent.click(container.querySelector('.tt-line-link .c-white')!);
    expect(onLink).toHaveBeenCalledWith(300);
  });

  it('makes a quick-index entry one link, number and label, and leaves the padding out', () => {
    const onLink = vi.fn();
    const entry: GridRow = {
      segments: [{ text: ' ' }, { text: '300 ', color: 'yellow', link: 300 }, { text: 'SKILLS', color: 'white', link: 300 }, { text: '     ' }],
    };
    const { container } = render(<GridLine content={entry} row={2} width={16} onLink={onLink} />);
    const links = container.querySelectorAll('.tt-line-link');
    expect(links).toHaveLength(1);
    expect(links[0].textContent).toBe('300 SKILLS');
    expect(links[0].classList).toContain('tt-line-link--plain');
    expect(container.querySelectorAll('.tt-link')).toHaveLength(0);
    fireEvent.click(container.querySelector('.tt-line-link .c-white')!);
    expect(onLink).toHaveBeenCalledWith(300);
  });

  it('leaves a line with unlinked text as separate links', () => {
    const row: GridRow = { segments: [{ text: 'Skills', color: 'white' }, { ...directory.segments[2], link: undefined }, directory.segments[3]] };
    const { container } = render(<GridLine content={row} row={2} width={20} onLink={vi.fn()} />);
    expect(container.querySelector('.tt-line-link')).toBeNull();
    expect(container.querySelectorAll('.tt-link')).toHaveLength(1);
  });
});

describe('GridLine: Flummox! answers', () => {
  const answer: GridRow = {
    segments: [
      { text: ' ' },
      { text: '   ', bg: 'green', answer: 1 },
      { text: ' ITV', color: 'white', answer: 1 },
    ],
  };

  it('answers on a click and outlines the answer whose button has focus', () => {
    const onAnswer = vi.fn();
    const { container, rerender } = render(<GridLine content={answer} row={2} width={38} onAnswer={onAnswer} />);
    fireEvent.click(container.querySelectorAll('.tt-link')[1]);
    expect(onAnswer).toHaveBeenCalledWith(1);
    expect(container.querySelectorAll('.tt-twin-focus')).toHaveLength(0);
    rerender(<GridLine content={answer} row={2} width={38} onAnswer={onAnswer} focusAnswer={1} />);
    expect(container.querySelectorAll('.tt-twin-focus')).toHaveLength(2);
  });
});
