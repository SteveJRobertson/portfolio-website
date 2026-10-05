import type { GridRow } from './rows';
import type { TeletextColor } from '../types/teletext';

export interface QuickIndexEntry {
  page: number;
  label: string;
}

/** Each magazine keeps the colour it has on the Fastext bar; 8xx is the odd one out. */
const MAGAZINE_COLORS: Record<number, TeletextColor> = { 1: 'red', 2: 'green', 3: 'yellow', 4: 'cyan', 8: 'magenta' };

/** Each entry links to its page, so it responds to a click (see GridLine). */
const entry = ({ page, label }: QuickIndexEntry): GridRow => ({
  segments: [
    { text: ' ' },
    { text: `${page} `, color: MAGAZINE_COLORS[Math.floor(page / 100)] ?? 'white', link: page },
    { text: label, color: 'white', link: page },
  ],
});

const rule = (): GridRow => ({ segments: [{ text: ' ' + '-'.repeat(15), color: 'yellow' }] });

/** Widescreen quick index, one row per body slot, built from the page registry. */
export const sidebarRows = (entries: readonly QuickIndexEntry[]): GridRow[] => [
  { segments: [{ text: ' QUICK INDEX', color: 'cyan' }] },
  rule(),
  ...entries.map(entry),
  rule(),
];
