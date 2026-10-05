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

/** The page a directory line links to as a whole: its leader dots link, and so does all its text. */
const lineLink = (row: GridRow): number | undefined => {
  const dots = row.segments.find((s) => s.leaderDots);
  if (dots?.link === undefined) return undefined;
  return row.segments.every((s) => !s.text.trim() || s.link === dots.link) ? dots.link : undefined;
};

/**
 * One row of text pinned to its grid cells. Double-height rows span two row
 * slots. Hidden from assistive tech: the semantic mirror carries the content.
 * A directory line ("About me.......101") is one link from label to number,
 * and its dots draw solid while it's hovered.
 */
export const GridLine: React.FC<GridLineProps> = ({ content, row, col = 1, width, height = 1, onLink, onOpen, focusLink, focusHref }) => {
  const whole = onLink ? lineLink(content) : undefined;
  return (
    <div
      aria-hidden="true"
      className={height === 2 ? 'tt-line tt-line--double' : 'tt-line'}
      style={{ gridRow: `${row} / span ${height}`, gridColumn: `${col} / span ${width}` }}
    >
      <span
        className={whole === undefined ? 'tt-line__text' : ['tt-line__text tt-line-link', whole === focusLink && 'tt-twin-focus'].filter(Boolean).join(' ')}
        onClick={whole === undefined ? undefined : () => onLink!(whole)}
      >
        {content.segments.map((segment, i) => {
          const { link, href } = segment;
          const onClick =
            whole !== undefined
              ? undefined
              : link !== undefined && onLink
                ? () => onLink(link)
                : href !== undefined && onOpen
                  ? () => onOpen(href)
                  : undefined;
          const focused = whole === undefined && ((link !== undefined && link === focusLink) || (href !== undefined && href === focusHref));
          return (
            <ColorSpan
              key={i}
              color={segment.color ?? 'white'}
              bg={segment.bg}
              mosaic={segment.mosaic}
              className={[onClick && 'tt-link', focused && 'tt-twin-focus', segment.leaderDots && 'tt-leader'].filter(Boolean).join(' ')}
              onClick={onClick}
            >
              {segment.text}
            </ColorSpan>
          );
        })}
      </span>
    </div>
  );
};
