import type { TeletextPageData } from '../types/teletext';

import page100 from '../content/pages/page100.json';
import page101 from '../content/pages/page101.json';
import page200 from '../content/pages/page200.json';
import page201 from '../content/pages/page201.json';
import page300 from '../content/pages/page300.json';
import page400 from '../content/pages/page400.json';

const registry: Record<number, TeletextPageData> = {
  100: page100 as TeletextPageData,
  101: page101 as TeletextPageData,
  200: page200 as TeletextPageData,
  201: page201 as TeletextPageData,
  300: page300 as TeletextPageData,
  400: page400 as TeletextPageData,
};

export const getPageData = (pageNum: number): TeletextPageData | undefined => {
  return registry[pageNum];
};

export const getValidPageNumbers = (): number[] => {
  return Object.keys(registry).map((k) => parseInt(k, 10));
};
