import React from 'react';

interface TeletextGridProps {
  cols: number;
  rows: number;
  children?: React.ReactNode;
}

/**
 * An exact `cols × rows` character grid. Each cell is one Bedstead glyph
 * (0.6em × 1em); children place themselves with grid-row / grid-column.
 */
export const TeletextGrid: React.FC<TeletextGridProps> = ({ cols, rows, children }) => (
  <div
    className="tt-grid"
    data-cols={cols}
    data-rows={rows}
    style={{ '--cols': cols, '--rows': rows } as React.CSSProperties}
  >
    {children}
  </div>
);
