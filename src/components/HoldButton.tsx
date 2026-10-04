import React from 'react';

interface HoldButtonProps {
  held: boolean;
  onToggle: () => void;
}

/**
 * HOLD, as on a TV set: freezes the cycling sub-pages (SPEC §5). It sits in the
 * strip under the screen on pages with sub-pages, so it works with shortcuts
 * off and on a phone (WCAG 2.2.2).
 */
export const HoldButton: React.FC<HoldButtonProps> = ({ held, onToggle }) => (
  <button type="button" className="hold-toggle" aria-pressed={held} onClick={onToggle}>
    HOLD <span aria-hidden="true">{held ? 'ON' : 'OFF'}</span>
  </button>
);
