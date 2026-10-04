import React from 'react';
import { ColorSpan } from './ColorSpan';
import type { GridRow } from '../display/rows';

interface GridLineProps {
  content: GridRow;
  row: number;
  col?: number;
  width: number;
  height?: 1 | 2;
}

/** One row of text pinned to its grid cells. Double-height rows span two row slots. */
export const GridLine: React.FC<GridLineProps> = ({ content, row, col = 1, width, height = 1 }) => (
  <div
    className={height === 2 ? 'tt-line tt-line--double' : 'tt-line'}
    style={{ gridRow: `${row} / span ${height}`, gridColumn: `${col} / span ${width}` }}
  >
    <span className="tt-line__text">
      {content.segments.map((segment, i) => (
        <ColorSpan key={i} color={segment.color ?? 'white'} bg={segment.bg}>
          {segment.text}
        </ColorSpan>
      ))}
    </span>
  </div>
);
