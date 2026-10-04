import React, { useEffect } from 'react';
import type { FastTextLink } from '../types/teletext';

interface FastTextBarProps {
  links: {
    red: FastTextLink;
    green: FastTextLink;
    yellow: FastTextLink;
    cyan: FastTextLink;
  };
  onNavigate: (page: number) => void;
}

export const FastTextBar: React.FC<FastTextBarProps> = ({
  links,
  onNavigate,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ignore shortcut combinations (e.g. Cmd+R, Ctrl+R, Alt+Tab)
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'r') onNavigate(links.red.page);
      if (key === 'g') onNavigate(links.green.page);
      if (key === 'y') onNavigate(links.yellow.page);
      if (key === 'c' || key === 'b') onNavigate(links.cyan.page);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [links, onNavigate]);

  return (
    <nav className="fasttext-bar" aria-label="Teletext Fastext Navigation">
      <button 
        type="button" 
        className="fasttext-btn bg-red"
        onClick={() => onNavigate(links.red.page)}
      >
        {links.red.label}
      </button>

      <button 
        type="button" 
        className="fasttext-btn bg-green"
        onClick={() => onNavigate(links.green.page)}
      >
        {links.green.label}
      </button>

      <button 
        type="button" 
        className="fasttext-btn bg-yellow"
        onClick={() => onNavigate(links.yellow.page)}
      >
        {links.yellow.label}
      </button>

      <button 
        type="button" 
        className="fasttext-btn bg-cyan"
        onClick={() => onNavigate(links.cyan.page)}
      >
        {links.cyan.label}
      </button>
    </nav>
  );
};
