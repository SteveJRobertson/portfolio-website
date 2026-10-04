import { blankRow, type GridRow } from './rows';
import type { TeletextColor } from '../types/teletext';

const entry = (page: number, label: string, color: TeletextColor): GridRow => ({
  segments: [{ text: ` ${page} `, color }, { text: label, color: 'white' }],
});

/** Widescreen quick index, one row per body slot. */
export const SIDEBAR_ROWS: GridRow[] = [
  { segments: [{ text: ' QUICK INDEX', color: 'cyan' }] },
  { segments: [{ text: ' ' + '-'.repeat(15), color: 'yellow' }] },
  entry(100, 'HOME', 'red'),
  entry(101, 'ABOUT', 'red'),
  entry(200, 'PROJECTS', 'green'),
  entry(300, 'STACK', 'yellow'),
  entry(400, 'CONTACT', 'cyan'),
  entry(888, 'A11Y MODE', 'magenta'),
  { segments: [{ text: ' ' + '-'.repeat(15), color: 'yellow' }] },
  blankRow(),
  { segments: [{ text: ' EDINBURGH, UK', color: 'white' }] },
];
