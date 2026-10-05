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
    expect(line.textContent).toBe(' Skills....300');
    expect(container.querySelector('.tt-leader')?.textContent).toBe('....');
    fireEvent.click(container.querySelector('.c-white')!);
    expect(onLink).toHaveBeenCalledWith(300);
  });

  it('leaves a line with unlinked text as separate links', () => {
    const row: GridRow = { segments: [{ text: 'Skills', color: 'white' }, { ...directory.segments[2], link: undefined }, directory.segments[3]] };
    const { container } = render(<GridLine content={row} row={2} width={20} onLink={vi.fn()} />);
    expect(container.querySelector('.tt-line-link')).toBeNull();
    expect(container.querySelectorAll('.tt-link')).toHaveLength(1);
  });
});
