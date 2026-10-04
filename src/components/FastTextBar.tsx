import React, { useEffect } from 'react';
import type { FastTextLink } from '../types/teletext';
import { FASTEXT_ORDER, fastextLabels, fastextSlotWidths } from '../display/fastext';

interface FastTextBarProps {
  links: {
    red: FastTextLink;
    green: FastTextLink;
    yellow: FastTextLink;
    cyan: FastTextLink;
  };
  onNavigate: (page: number) => void;
  /** Grid width; the bar fills the last row in four equal slots. */
  cols: number;
  /** 1-based grid row (the last row of the screen). */
  row: number;
}

export const FastTextBar: React.FC<FastTextBarProps> = ({
  links,
  onNavigate,
  cols,
  row,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ignore shortcut combinations (e.g. Cmd+R, Ctrl+R, Alt+Tab)
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'r') onNavigate(links.red.page);
      if (key === 'g') onNavigate(links.green.page);
      if (key === 'y') onNavigate(links.yellow.page);
      if (key === 'c' || key === 'b') onNavigate(links.cyan.page);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [links, onNavigate]);

  const widths = fastextSlotWidths(cols);
  const labels = fastextLabels(FASTEXT_ORDER.map((color) => links[color]), widths);

  return (
    <nav
      className="tt-line fasttext-bar"
      aria-label="Teletext Fastext Navigation"
      style={{ gridRow: `${row} / span 1`, gridColumn: `1 / span ${cols}` }}
    >
      {FASTEXT_ORDER.map((color, i) => (
        <button
          key={color}
          type="button"
          className={`fasttext-btn bg-${color}`}
          style={{ width: `calc(${widths[i]} * var(--tt-cell-w))` }}
          onClick={() => onNavigate(links[color].page)}
        >
          {labels[i]}
        </button>
      ))}
    </nav>
  );
};
