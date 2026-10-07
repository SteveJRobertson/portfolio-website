import React, { useId, useRef, useState } from 'react';
import type { FastextLink } from '../types/teletext';
import { NAVIGABLE_PAGES } from '../content/registry';
import { FASTEXT_ORDER, fastextName, type FastextActions } from '../display/fastext';

interface MobileKeypadProps {
  /** The shared digit buffer's text, e.g. "P1--". */
  buffer: string;
  onDigit: (digit: string) => void;
  onClear: () => void;
  /** The current page's Fastext links, red to cyan. */
  fastext: readonly FastextLink[];
  /** Slots that act on this page instead of linking (Flummox!). */
  fastextActions?: FastextActions;
  onNavigate: (page: number) => void;
  /** Steps through the current page's sub-pages (-1 or +1). */
  onSubpage: (delta: number) => void;
  /** HOLD for pages with sub-pages; left out on single pages. */
  hold?: { held: boolean; onToggle: () => void };
  currentPage: number;
}

/**
 * The remote handset (SPEC §5): on-screen buttons, so a phone's keyboard never
 * opens. It feeds the same digit buffer as the keyboard.
 */
export const MobileKeypad: React.FC<MobileKeypadProps> = ({
  buffer,
  onDigit,
  onClear,
  fastext,
  fastextActions,
  onNavigate,
  onSubpage,
  hold,
  currentPage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const bodyId = useId();

  const close = () => {
    setIsOpen(false);
    toggle.current?.focus();
  };

  const stepPage = (delta: number) => {
    const at = NAVIGABLE_PAGES.indexOf(currentPage);
    onNavigate(at === -1 ? 100 : NAVIGABLE_PAGES[(at + delta + NAVIGABLE_PAGES.length) % NAVIGABLE_PAGES.length]);
  };

  return (
    <div className="teletext-remote-control">
      <button
        ref={toggle}
        type="button"
        className="remote-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={bodyId}
      >
        {isOpen ? 'HIDE REMOTE' : 'REMOTE'}
      </button>

      <div
        id={bodyId}
        role="group"
        aria-label="Remote handset"
        className="remote-handset-body"
        hidden={!isOpen}
        onKeyDown={(e) => {
          if (e.key === 'Escape') close();
        }}
      >
        <div className="remote-header">
          <span>REMOTE HANDSET</span>
          <span className="remote-buffer-display" aria-hidden="true">
            {buffer}
          </span>
        </div>

        <div className="remote-keypad-grid">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button key={num} type="button" className="remote-num-btn" onClick={() => onDigit(num)}>
              {num}
            </button>
          ))}
          <button type="button" className="remote-num-btn" aria-label="CLR: clear" onClick={onClear}>
            CLR
          </button>
          <button type="button" className="remote-num-btn" onClick={() => onDigit('0')}>
            0
          </button>
          <button type="button" className="remote-num-btn" aria-label="100: index" onClick={() => onNavigate(100)}>
            100
          </button>
        </div>

        <div className="remote-nav-row">
          <button type="button" className="remote-btn nav-btn" onClick={() => stepPage(-1)}>
            <span aria-hidden="true">▲</span> PREV PAGE
          </button>
          <button type="button" className="remote-btn nav-btn" onClick={() => stepPage(1)}>
            <span aria-hidden="true">▼</span> NEXT PAGE
          </button>
          <button type="button" className="remote-btn nav-btn" aria-label="Previous sub-page" onClick={() => onSubpage(-1)}>
            ◀ SUB
          </button>
          <button type="button" className="remote-btn nav-btn" aria-label="Next sub-page" onClick={() => onSubpage(1)}>
            SUB ▶
          </button>
          {hold && (
            <button type="button" className="remote-btn nav-btn" aria-pressed={hold.held} onClick={hold.onToggle}>
              HOLD
            </button>
          )}
          <button type="button" className="remote-btn nav-btn" aria-label="888 A11Y: accessibility" onClick={() => onNavigate(888)}>
            888 A11Y
          </button>
        </div>

        {/* The coloured keys, as on a TV remote: no text, named for screen readers */}
        <div className="remote-fastext-row">
          {FASTEXT_ORDER.map((color, i) => (
            <button
              key={color}
              type="button"
              className={`remote-btn remote-fastext-btn bg-${color}`}
              aria-label={fastextActions?.[i]?.name ?? fastextName(i, fastext[i])}
              onClick={() => {
                const action = fastextActions?.[i];
                if (action) action.onPress();
                else onNavigate(fastext[i].page);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
