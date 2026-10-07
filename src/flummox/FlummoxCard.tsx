import { TeletextGrid } from '../components/TeletextGrid';
import { GridLine } from '../components/GridLine';
import { CARD_COLS, CARD_ROWS } from '../content/flummox/quiz';
import { fitRow } from '../display/rows';
import type { GridRow } from '../types/teletext';
import { quiz } from './quizData';

/** Which card: page 152's own, or a score from 0 to 12. */
export type CardName = 'intro' | `score-${number}`;

const SITE = 'STEVEROBERTSON.DEV';

/** The header, as on the site but with the address where the clock goes, so the cards never go stale. */
const HEADER: GridRow = {
  segments: [
    { text: 'P152', color: 'white', bg: 'blue' },
    { text: ' ' },
    { text: 'STEEVEFAX', color: 'yellow' },
    { text: ' ' },
    { text: '152', color: 'cyan' },
    { text: ' '.repeat(CARD_COLS - 19 - SITE.length) },
    { text: SITE, color: 'green' },
  ],
};

const cardRows = (card: CardName): GridRow[] => (card === 'intro' ? quiz.cards.intro : quiz.cards.scores[Number(card.slice('score-'.length))]);

/**
 * A link-preview picture (docs/flummox/SPEC.md §6): a widescreen Teletext
 * screen in the middle of a 1200 × 630 black frame, captured by
 * `npm run share-images`.
 */
export const FlummoxCard = ({ card }: { card: CardName }) => {
  const rows = cardRows(card);
  // Each row's first grid row: the header is row 1, and a double-height row takes two
  const starts = rows.map((_, i) => 2 + rows.slice(0, i).reduce((n, r) => n + (r.doubleHeight ? 2 : 1), 0));
  return (
    <div className="flummox-card" data-card={card} style={{ width: 1200, height: 630, display: 'grid', placeItems: 'center', background: 'var(--tt-black)', fontSize: 25 }}>
      <TeletextGrid cols={CARD_COLS} rows={CARD_ROWS + 1}>
        <GridLine row={1} width={CARD_COLS} content={HEADER} />
        {rows.map((row, i) => (
          <GridLine key={i} row={starts[i]} width={CARD_COLS} height={row.doubleHeight ? 2 : 1} content={fitRow(row, CARD_COLS)} />
        ))}
      </TeletextGrid>
    </div>
  );
};
