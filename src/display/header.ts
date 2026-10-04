import { fitRow, type GridRow } from './rows';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const two = (n: number) => String(n).padStart(2, '0');

interface HeaderInput {
  bufferText: string;
  currentPage: number;
  now: Date;
  cols: number;
  /** Shown as "1/6" after the page number when a page has sub-pages, with "HOLD" while held. */
  subpage?: { index: number; count: number; held?: boolean };
}

/**
 * Row 1, exactly `cols` wide:
 *   56: P100 STEEVEFAX 100 ...... SUN 04 OCT 14:03:22
 *   40: P100 STEEVEFAX 100 ...... 04 OCT 14:03:22
 *   20: P100 STEVE ..... 14:03
 * With sub-pages the counter follows the page number: "STEEVEFAX 110 1/6",
 * or "1/6 STEVE" at 20 columns. While HOLD is on it follows the counter, as on
 * a TV set: "STEEVEFAX 110 1/6 HOLD", with the date dropped at 40 columns to
 * make room, or "1/6 HOLD" in place of the name at 20.
 */
export const formatHeader = ({ bufferText, currentPage, now, cols, subpage }: HeaderInput): GridRow => {
  const buffer = bufferText.padEnd(4, ' ').slice(0, 4);
  const page = String(currentPage).padStart(3, '0');
  const time = `${two(now.getHours())}:${two(now.getMinutes())}`;
  const date = `${two(now.getDate())} ${MONTHS[now.getMonth()]}`;

  const counter = subpage && subpage.count > 1 ? [{ text: `${subpage.index + 1}/${subpage.count}`, color: 'white' as const }] : [];

  const held = counter.length > 0 && subpage?.held === true;
  const hold = held ? [{ text: ' ' }, { text: 'HOLD', color: 'red' as const }] : [];

  const left =
    cols < 40
      ? held
        ? [...counter, ...hold]
        : [...counter.flatMap((c) => [c, { text: ' ' }]), { text: 'STEVE', color: 'yellow' as const }]
      : [
          { text: 'STEEVEFAX', color: 'yellow' as const },
          { text: ' ' },
          { text: page, color: 'cyan' as const },
          ...counter.flatMap((c) => [{ text: ' ' }, c]),
          ...hold,
        ];
  const seconds = `${time}:${two(now.getSeconds())}`;
  const right = cols < 40 ? time : cols < 56 ? (held ? seconds : `${date} ${seconds}`) : `${DAYS[now.getDay()]} ${date} ${seconds}`;

  const leftWidth = 4 + 1 + left.reduce((n, s) => n + s.text.length, 0);
  const gap = Math.max(1, cols - leftWidth - right.length);

  return fitRow(
    {
      segments: [
        { text: buffer, color: 'white', bg: 'blue' },
        { text: ' ' },
        ...left,
        { text: ' '.repeat(gap) },
        { text: right, color: 'green' },
      ],
    },
    cols,
  );
};
