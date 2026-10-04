import React from 'react';
import { TeletextGrid } from './TeletextGrid';
import { ScanlineOverlay } from './ScanlineOverlay';
import type { GridMode } from '../display/gridModes';

interface TeletextScreenProps {
  mode: GridMode;
  /** Draw the CRT scanlines and glow. */
  crt?: boolean;
  children: React.ReactNode;
}

/**
 * The CRT frame: sizes the font so the whole grid fits the viewport, then
 * hosts the grid. Not a landmark: the page's `<main>` is the semantic mirror.
 */
export const TeletextScreen: React.FC<TeletextScreenProps> = ({
  mode,
  crt = false,
  children,
}) => (
  <div
    className={crt ? 'teletext-screen teletext-screen--crt' : 'teletext-screen'}
    data-mode={mode.name}
    style={{ '--cols': mode.cols, '--rows': mode.rows } as React.CSSProperties}
  >
    <TeletextGrid cols={mode.cols} rows={mode.rows}>
      {children}
    </TeletextGrid>
    {crt && <ScanlineOverlay />}
  </div>
);
