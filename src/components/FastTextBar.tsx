import React from 'react';
import type { FastextLink } from '../types/teletext';
import { FASTEXT_ORDER, fastextLabels, fastextName, fastextSlotWidths } from '../display/fastext';
import { isPlainClick, pageHref } from '../navigation/paths';

interface FastTextBarProps {
  /** Red, green, yellow, cyan. */
  links: readonly [FastextLink, FastextLink, FastextLink, FastextLink];
  onNavigate: (page: number) => void;
  /** Grid width; the bar fills the last row in four equal slots. */
  cols: number;
  /** 1-based grid row (the last row of the screen). */
  row: number;
}

/**
 * The Fastext row: four real links drawn in the grid's last row (SPEC §5),
 * each in its key's colour on black, as on a real set.
 * A plain click navigates in place; a modified click opens a new tab as usual.
 * The R/G/Y/B hotkeys live in useHotkeys.
 */
export const FastTextBar: React.FC<FastTextBarProps> = ({ links, onNavigate, cols, row }) => {
  const widths = fastextSlotWidths(cols);
  const labels = fastextLabels(links, widths);

  return (
    <nav
      className="tt-line fasttext-bar"
      aria-label="Fastext"
      style={{ gridRow: `${row} / span 1`, gridColumn: `1 / span ${cols}` }}
    >
      {FASTEXT_ORDER.map((color, i) => (
        <a
          key={color}
          href={pageHref(links[i].page)}
          aria-label={fastextName(i, links[i])}
          className={`fasttext-btn fasttext-btn--${color}`}
          style={{ width: `calc(${widths[i]} * var(--tt-cell-w))` }}
          onClick={(e) => {
            if (!isPlainClick(e)) return;
            e.preventDefault();
            onNavigate(links[i].page);
          }}
        >
          {labels[i]}
        </a>
      ))}
    </nav>
  );
};
