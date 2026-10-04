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
  /** Opens an email or web address when its text is clicked or tapped. Like `onLink`, never a tab stop. */
  onOpen?: (href: string) => void;
  /** Outline the text linking to this page: its twin in the semantic mirror has focus. */
  focusLink?: number;
  /** Outline the text of this address: its twin in the semantic mirror has focus. */
  focusHref?: string;
}

/**
 * One row of text pinned to its grid cells. Double-height rows span two row
 * slots. Hidden from assistive tech: the semantic mirror carries the content.
 */
export const GridLine: React.FC<GridLineProps> = ({ content, row, col = 1, width, height = 1, onLink, onOpen, focusLink, focusHref }) => (
  <div
    aria-hidden="true"
    className={height === 2 ? 'tt-line tt-line--double' : 'tt-line'}
    style={{ gridRow: `${row} / span ${height}`, gridColumn: `${col} / span ${width}` }}
  >
    <span className="tt-line__text">
      {content.segments.map((segment, i) => {
        const { link, href } = segment;
        const onClick =
          link !== undefined && onLink ? () => onLink(link) : href !== undefined && onOpen ? () => onOpen(href) : undefined;
        const focused = (link !== undefined && link === focusLink) || (href !== undefined && href === focusHref);
        return (
          <ColorSpan
            key={i}
            color={segment.color ?? 'white'}
            bg={segment.bg}
            className={[onClick && 'tt-link', focused && 'tt-twin-focus'].filter(Boolean).join(' ')}
            onClick={onClick}
          >
            {segment.text}
          </ColorSpan>
        );
      })}
    </span>
  </div>
);
