import React from 'react';
import { ICONS, ICON_GRID, iconRuns, type IconName } from '../icons/icons';
import type { TeletextColor } from '../types/teletext';

interface TeletextIconProps {
  name: IconName;
  /** Draws the icon in one colour instead of its own. */
  color?: TeletextColor;
  /** Width and height: px, or any CSS length. 24 px by default, so each pixel of the 12 × 12 grid is 2 × 2. */
  size?: number | string;
  /** The accessible name. Defaults to the icon's label; pass '' when text beside it already names it. */
  label?: string;
}

/** A social or sharing icon in Teletext-style pixel art, in the palette's colours. */
export const TeletextIcon: React.FC<TeletextIconProps> = ({ name, color, size = 24, label = ICONS[name].label }) => (
  <svg
    width={size}
    height={size}
    viewBox={`0 0 ${ICON_GRID} ${ICON_GRID}`}
    shapeRendering="crispEdges"
    role={label ? 'img' : undefined}
    aria-label={label || undefined}
    aria-hidden={label ? undefined : true}
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    {iconRuns(name, color).map((run) => (
      <rect key={`${run.x},${run.y}`} x={run.x} y={run.y} width={run.width} height={1} fill={`var(--tt-${run.color})`} />
    ))}
  </svg>
);
