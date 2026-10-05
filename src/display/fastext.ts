import type { FastextLink } from '../types/teletext';

export const FASTEXT_ORDER = ['red', 'green', 'yellow', 'cyan'] as const;

/** Four equal slots that fill the row: 14 / 10 / 8 cells. */
export const fastextSlotWidths = (cols: number): number[] => {
  const base = Math.floor(cols / 4);
  const extra = cols - base * 4;
  return FASTEXT_ORDER.map((_, i) => base + (i < extra ? 1 : 0));
};

/** A Fastext label as shown: capitalised ("About"), so the bar sits quietly under the page. */
export const fastextLabel = (link: FastextLink): string => {
  const label = link.label.trim().toLowerCase();
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const labelForms = (link: FastextLink): string[] => [fastextLabel(link), String(link.page)];

const centre = (label: string, width: number, leanRight = false): string => {
  const text = label.slice(0, width);
  const spare = width - text.length;
  const left = leanRight ? Math.ceil(spare / 2) : Math.floor(spare / 2);
  return ' '.repeat(left) + text + ' '.repeat(spare - left);
};

/** True when every pair of neighbouring slots has at least one blank cell between their labels. */
const separated = (slots: string[]): boolean =>
  slots.every((slot, i) => i === 0 || /\s$/.test(slots[i - 1]) || /^\s/.test(slot));

/**
 * Labels for the four slots, centred and padded to each slot's width. All four
 * use the same form: the label ("About") if every label fits its slot with a
 * blank cell to spare, otherwise the page number ("101"). The spare cell keeps
 * neighbouring labels apart, so they never run together. Where a label only
 * just fills its slot, as in portrait, labels still win if leaning the centring
 * right leaves a blank cell between every pair.
 */
export const fastextLabels = (links: readonly FastextLink[], widths: number[]): string[] => {
  const forms = links.map(labelForms);
  if (forms.every((f, i) => f[0].length < widths[i])) return forms.map((f, i) => centre(f[0], widths[i]));
  if (forms.every((f, i) => f[0].length <= widths[i])) {
    const tight = forms.map((f, i) => centre(f[0], widths[i], true));
    if (separated(tight)) return tight;
  }
  return forms.map((f, i) => centre(f[1], widths[i]));
};

const SLOT_NAMES = ['Red', 'Green', 'Yellow', 'Cyan'];

/** Accessible name for a slot, e.g. "Red: About, page 101". It contains the visible label or number (WCAG 2.5.3). */
export const fastextName = (slot: number, link: FastextLink): string =>
  `${SLOT_NAMES[slot]}: ${fastextLabel(link)}, page ${link.page}`;
