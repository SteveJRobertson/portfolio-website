import type { FastextLink } from '../types/teletext';

export const FASTEXT_ORDER = ['red', 'green', 'yellow', 'cyan'] as const;

/** Four equal slots that fill the row: 14 / 10 / 5 cells. */
export const fastextSlotWidths = (cols: number): number[] => {
  const base = Math.floor(cols / 4);
  const extra = cols - base * 4;
  return FASTEXT_ORDER.map((_, i) => base + (i < extra ? 1 : 0));
};

const labelForms = (link: FastextLink): string[] => [link.label.trim(), String(link.page)];

const centre = (label: string, width: number): string => {
  const text = label.slice(0, width);
  const left = Math.floor((width - text.length) / 2);
  return ' '.repeat(left) + text + ' '.repeat(width - text.length - left);
};

/**
 * Labels for the four slots, centred and padded to each slot's width. All four
 * use the same form: the label ("ABOUT") if every label fits its slot, otherwise
 * the page number ("101").
 */
export const fastextLabels = (links: readonly FastextLink[], widths: number[]): string[] => {
  const forms = links.map(labelForms);
  const tier = forms.every((f, i) => f[0].length <= widths[i]) ? 0 : 1;
  return forms.map((f, i) => centre(f[tier], widths[i]));
};
