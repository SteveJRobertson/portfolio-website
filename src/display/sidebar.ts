import { blankRow, type GridRow } from './rows';
import type { TeletextColor } from '../types/teletext';

export interface QuickIndexEntry {
  page: number;
  label: string;
}

/** Each magazine keeps the colour it has on the Fastext bar; 8xx is the odd one out. */
const MAGAZINE_COLORS: Record<number, TeletextColor> = { 1: 'red', 2: 'green', 3: 'yellow', 4: 'cyan', 8: 'magenta' };

const entry = ({ page, label }: QuickIndexEntry): GridRow => ({
  segments: [
    { text: ` ${page} `, color: MAGAZINE_COLORS[Math.floor(page / 100)] ?? 'white' },
    { text: label, color: 'white' },
  ],
});

const rule = (): GridRow => ({ segments: [{ text: ' ' + '-'.repeat(15), color: 'yellow' }] });

/** Widescreen quick index, one row per body slot, built from the page registry. */
export const sidebarRows = (entries: readonly QuickIndexEntry[]): GridRow[] => [
  { segments: [{ text: ' QUICK INDEX', color: 'cyan' }] },
  rule(),
  ...entries.map(entry),
  rule(),
  blankRow(),
  { segments: [{ text: ' EDINBURGH, UK', color: 'white' }] },
];
