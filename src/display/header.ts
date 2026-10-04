import { fitRow, type GridRow } from './rows';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const two = (n: number) => String(n).padStart(2, '0');

interface HeaderInput {
  bufferText: string;
  currentPage: number;
  now: Date;
  cols: number;
}

/**
 * Row 1, exactly `cols` wide:
 *   56: P100 STEVE-TEXT 100 ...... SUN 04 OCT 14:03:22
 *   40: P100 STEVE-TEXT 100 ...... 04 OCT 14:03:22
 *   20: P100 STEVE ..... 14:03
 */
export const formatHeader = ({ bufferText, currentPage, now, cols }: HeaderInput): GridRow => {
  const buffer = bufferText.padEnd(4, ' ').slice(0, 4);
  const page = String(currentPage).padStart(3, '0');
  const time = `${two(now.getHours())}:${two(now.getMinutes())}`;
  const date = `${two(now.getDate())} ${MONTHS[now.getMonth()]}`;

  const left =
    cols < 40
      ? [{ text: 'STEVE', color: 'yellow' as const }]
      : [
          { text: 'STEVE-TEXT', color: 'yellow' as const },
          { text: ' ' },
          { text: page, color: 'cyan' as const },
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
