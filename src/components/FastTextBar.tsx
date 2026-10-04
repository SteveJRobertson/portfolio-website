import React, { useEffect } from 'react';
import type { FastextLink } from '../types/teletext';
import { FASTEXT_ORDER, fastextLabels, fastextSlotWidths } from '../display/fastext';

interface FastTextBarProps {
  /** Red, green, yellow, cyan. */
  links: readonly [FastextLink, FastextLink, FastextLink, FastextLink];
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
      if (key === 'r') onNavigate(links[0].page);
      if (key === 'g') onNavigate(links[1].page);
      if (key === 'y') onNavigate(links[2].page);
      if (key === 'c' || key === 'b') onNavigate(links[3].page);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [links, onNavigate]);

  const widths = fastextSlotWidths(cols);
  const labels = fastextLabels(links, widths);

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
          onClick={() => onNavigate(links[i].page)}
        >
          {labels[i]}
        </button>
      ))}
    </nav>
  );
};
