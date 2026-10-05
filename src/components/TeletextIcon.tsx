import React from 'react';
import { TeletextGrid } from './TeletextGrid';
import { GridLine } from './GridLine';
import { ICONS, ICON_HEIGHT, ICON_WIDTH, iconRows, type IconName } from '../icons/icons';
import type { TeletextColor } from '../types/teletext';

interface TeletextIconProps {
  name: IconName;
  /** Draws the icon in one colour instead of its own. */
  color?: TeletextColor;
  /** The accessible name. Defaults to the icon's label; pass '' when text beside it already names it. */
  label?: string;
}

const COLS = ICON_WIDTH / 2;
const ROWS = ICON_HEIGHT / 3;

/** A social or sharing icon in mosaic graphics: 7 columns by 4 rows of the grid, sized by the font size. */
export const TeletextIcon: React.FC<TeletextIconProps> = ({ name, color, label = ICONS[name].label }) => (
  <span role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true} style={{ display: 'inline-block' }}>
    <TeletextGrid cols={COLS} rows={ROWS}>
      {iconRows(name, color).map((content, i) => (
        <GridLine key={i} row={i + 1} width={COLS} content={content} />
      ))}
    </TeletextGrid>
  </span>
);
