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
 * The page a line links to as a whole: every word on it (a directory line's
 * label, dots and number, or a quick-index entry's number and label) links to
 * the same page, so it's one link rather than several.
 */
const lineLink = (row: GridRow): number | undefined => {
  const words = row.segments.filter((s) => s.text.trim());
  const link = words[0]?.link;
  if (link === undefined || words.length < 2) return undefined;
  return words.every((s) => s.link === link) ? link : undefined;
};

/** Index of the first and last segment carrying `link`; the blanks around them stay outside the link. */
const linkedRange = (row: GridRow, link: number): [number, number] => [
  row.segments.findIndex((s) => s.link === link),
  row.segments.findLastIndex((s) => s.link === link),
];

/**
 * One row of text pinned to its grid cells. Double-height rows span two row
 * slots. Hidden from assistive tech: the semantic mirror carries the content.
 * A line whose words all link to one page ("About me.......101", or "101 ABOUT"
 * in the quick index) is one link from label to number. Hovering it draws its
 * leader dots solid, or underlines it if it has none.
 */
export const GridLine: React.FC<GridLineProps> = ({ content, row, col = 1, width, height = 1, onLink, onOpen, focusLink, focusHref }) => {
  const whole = onLink ? lineLink(content) : undefined;
  const span = (segment: GridRow['segments'][number], i: number) => {
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
  };

  let text: React.ReactNode = content.segments.map(span);
  if (whole !== undefined) {
    const [first, last] = linkedRange(content, whole);
    const linked = content.segments.slice(first, last + 1);
    text = (
      <>
        {content.segments.slice(0, first).map(span)}
        <span
          className={[
            'tt-line-link',
            !linked.some((s) => s.leaderDots) && 'tt-line-link--plain',
            whole === focusLink && 'tt-twin-focus',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => onLink!(whole)}
        >
          {linked.map((segment, i) => span(segment, first + i))}
        </span>
        {content.segments.slice(last + 1).map((segment, i) => span(segment, last + 1 + i))}
      </>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={height === 2 ? 'tt-line tt-line--double' : 'tt-line'}
      style={{ gridRow: `${row} / span ${height}`, gridColumn: `${col} / span ${width}` }}
    >
      <span className="tt-line__text">{text}</span>
    </div>
  );
};
