import { fitRow, type GridRow } from './rows';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const two = (n: number) => String(n).padStart(2, '0');

interface HeaderInput {
  bufferText: string;
  currentPage: number;
  now: Date;
  cols: number;
  /** Shown as "1/6" after the page number when a page has sub-pages. */
  subpage?: { index: number; count: number };
}

/**
 * Row 1, exactly `cols` wide:
 *   56: P100 STEVE-TEXT 100 ...... SUN 04 OCT 14:03:22
 *   40: P100 STEVE-TEXT 100 ...... 04 OCT 14:03:22
 *   20: P100 STEVE ..... 14:03
 * With sub-pages the counter follows the page number: "STEVE-TEXT 110 1/6",
 * or "1/6 STEVE" at 20 columns.
 */
export const formatHeader = ({ bufferText, currentPage, now, cols, subpage }: HeaderInput): GridRow => {
  const buffer = bufferText.padEnd(4, ' ').slice(0, 4);
  const page = String(currentPage).padStart(3, '0');
  const time = `${two(now.getHours())}:${two(now.getMinutes())}`;
  const date = `${two(now.getDate())} ${MONTHS[now.getMonth()]}`;

  const counter = subpage && subpage.count > 1 ? [{ text: `${subpage.index + 1}/${subpage.count}`, color: 'white' as const }] : [];

  const left =
    cols < 40
      ? [...counter.flatMap((c) => [c, { text: ' ' }]), { text: 'STEVE', color: 'yellow' as const }]
      : [
          { text: 'STEVE-TEXT', color: 'yellow' as const },
          { text: ' ' },
          { text: page, color: 'cyan' as const },
          ...counter.flatMap((c) => [{ text: ' ' }, c]),
        ];
  const right =
    cols < 40 ? time : cols < 56 ? `${date} ${time}:${two(now.getSeconds())}` : `${DAYS[now.getDay()]} ${date} ${time}:${two(now.getSeconds())}`;

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
