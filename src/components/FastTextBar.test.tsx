import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FastTextBar } from './FastTextBar';
import type { FastextLink } from '../types/teletext';

const links: [FastextLink, FastextLink, FastextLink, FastextLink] = [
  { page: 100, label: 'INDEX' },
  { page: 200, label: 'PROJECTS' },
  { page: 300, label: 'SKILLS' },
  { page: 400, label: 'CONTACT' },
];

describe('FastTextBar', () => {
  it('renders four real links with full accessible names', () => {
    render(<FastTextBar links={links} onNavigate={vi.fn()} cols={58} row={24} />);
    const anchors = screen.getAllByRole('link');
    expect(anchors.map((a) => a.getAttribute('href'))).toEqual(['/', '/200/', '/300/', '/400/']);
    expect(anchors.map((a) => a.getAttribute('aria-label'))).toEqual([
      'Red: Index, page 100',
      'Green: Projects, page 200',
      'Yellow: Skills, page 300',
      'Cyan: Contact, page 400',
    ]);
  });

  it('navigates in place on a plain click', () => {
    const onNavigate = vi.fn();
    render(<FastTextBar links={links} onNavigate={onNavigate} cols={58} row={24} />);
    const link = screen.getByRole('link', { name: /Projects/ });
    expect(fireEvent.click(link)).toBe(false); // default prevented
    expect(onNavigate).toHaveBeenCalledWith(200);
  });

  it('leaves modified and middle clicks to the browser (new tab and so on)', () => {
    const onNavigate = vi.fn();
    render(<FastTextBar links={links} onNavigate={onNavigate} cols={58} row={24} />);
    const link = screen.getByRole('link', { name: /Projects/ });
    expect(fireEvent.click(link, { metaKey: true })).toBe(true);
    expect(fireEvent.click(link, { ctrlKey: true })).toBe(true);
    expect(fireEvent.click(link, { button: 1 })).toBe(true);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('fills the row with four slots that shorten their labels to fit', () => {
    render(<FastTextBar links={links} onNavigate={vi.fn()} cols={20} row={36} />);
    expect(screen.getAllByRole('link').map((b) => b.textContent)).toEqual([' 100 ', ' 200 ', ' 300 ', ' 400 ']);
  });
});
