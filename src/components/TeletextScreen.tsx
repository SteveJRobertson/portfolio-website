import React from 'react';
import { TeletextGrid } from './TeletextGrid';
import type { GridMode } from '../display/gridModes';

interface TeletextScreenProps {
  mode: GridMode;
  children: React.ReactNode;
  ariaLabel?: string;
}

/** The CRT frame: sizes the font so the whole grid fits the viewport, then hosts the grid. */
export const TeletextScreen: React.FC<TeletextScreenProps> = ({
  mode,
  children,
  ariaLabel = 'Teletext CRT Display',
}) => (
  <main
    className="teletext-screen"
    aria-label={ariaLabel}
    data-mode={mode.name}
    style={{ '--cols': mode.cols, '--rows': mode.rows } as React.CSSProperties}
  >
    <TeletextGrid cols={mode.cols} rows={mode.rows}>
      {children}
    </TeletextGrid>
  </main>
);
