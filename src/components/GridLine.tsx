import React from 'react';
import { ColorSpan } from './ColorSpan';
import type { GridRow } from '../display/rows';

interface GridLineProps {
  content: GridRow;
  row: number;
  col?: number;
  width: number;
  height?: 1 | 2;
  /** Makes `{link:NNN}` text respond to a click or tap. It never takes keyboard focus: the real links are in the semantic mirror. */
  onLink?: (page: number) => void;
  /** Outline the whole line: its twin in the semantic mirror has focus. */
  focused?: boolean;
  /** Outline the text linking to this page: its twin in the semantic mirror has focus. */
  focusLink?: number;
}

/**
 * One row of text pinned to its grid cells. Double-height rows span two row
 * slots. Hidden from assistive tech: the semantic mirror carries the content.
 */
export const GridLine: React.FC<GridLineProps> = ({ content, row, col = 1, width, height = 1, onLink, focused, focusLink }) => (
  <div
    aria-hidden="true"
    className={['tt-line', height === 2 && 'tt-line--double', focused && 'tt-twin-focus'].filter(Boolean).join(' ')}
    style={{ gridRow: `${row} / span ${height}`, gridColumn: `${col} / span ${width}` }}
  >
    <span className="tt-line__text">
      {content.segments.map((segment, i) => {
        const link = segment.link;
        const isLink = link !== undefined && onLink !== undefined;
        return (
          <ColorSpan
            key={i}
            color={segment.color ?? 'white'}
            bg={segment.bg}
            className={[isLink && 'tt-link', link !== undefined && link === focusLink && 'tt-twin-focus'].filter(Boolean).join(' ')}
            onClick={isLink ? () => onLink(link) : undefined}
          >
            {segment.text}
          </ColorSpan>
        );
      })}
    </span>
  </div>
);
