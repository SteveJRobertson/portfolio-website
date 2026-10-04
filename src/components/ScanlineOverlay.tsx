import React from 'react';

/**
 * The CRT effect (SPEC §3): scanlines and a soft vignette over the screen.
 * The phosphor glow is a text shadow on the grid (`.teletext-screen--crt`).
 * It's static, so nothing moves, and it never takes clicks or reaches
 * assistive tech.
 */
export const ScanlineOverlay: React.FC = () => <div className="crt-overlay" aria-hidden="true" />;
