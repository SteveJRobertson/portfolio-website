import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FastTextBar } from './FastTextBar';
import type { FastTextLink } from '../types/teletext';

const link = (color: FastTextLink['color'], page: number): FastTextLink => ({
  label: `${color} [${page}]`,
  page,
  path: `/${page}`,
  color,
});

const links = {
  red: link('red', 101),
  green: link('green', 200),
  yellow: link('yellow', 300),
  cyan: link('cyan', 400),
};

describe('FastTextBar', () => {
  it('navigates when a button is clicked', () => {
    const onNavigate = vi.fn();
    render(<FastTextBar links={links} onNavigate={onNavigate} cols={56} row={24} />);
    fireEvent.click(screen.getByText('green [200]'));
    expect(onNavigate).toHaveBeenCalledWith(200);
  });

  it('maps R, G, Y and C hotkeys to the four links', () => {
    const onNavigate = vi.fn();
    render(<FastTextBar links={links} onNavigate={onNavigate} cols={56} row={24} />);
    ['r', 'g', 'y', 'c'].forEach((key) => fireEvent.keyDown(window, { key }));
    expect(onNavigate.mock.calls).toEqual([[101], [200], [300], [400]]);
  });

  it('ignores hotkeys with modifiers so Cmd/Ctrl+R still reloads', () => {
    const onNavigate = vi.fn();
    render(<FastTextBar links={links} onNavigate={onNavigate} cols={56} row={24} />);
    fireEvent.keyDown(window, { key: 'r', metaKey: true });
    fireEvent.keyDown(window, { key: 'r', ctrlKey: true });
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('fills the row with four slots that shorten their labels to fit', () => {
    render(<FastTextBar links={links} onNavigate={vi.fn()} cols={20} row={36} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual([' 101 ', ' 200 ', ' 300 ', ' 400 ']);
  });
});
