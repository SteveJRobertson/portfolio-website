import React, { useState } from 'react';
import { NAVIGABLE_PAGES } from '../content/registry';

interface MobileKeypadProps {
  onNavigate: (page: number) => void;
  /** Steps through the current page's sub-pages (-1 or +1). */
  onSubpage: (delta: number) => void;
  currentPage: number;
}

export const MobileKeypad: React.FC<MobileKeypadProps> = ({
  onNavigate,
  onSubpage,
  currentPage,
}) => {
  const [digits, setDigits] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleDigitClick = (numStr: string) => {
    const nextDigits = [...digits, numStr];
    setDigits(nextDigits);

    if (nextDigits.length === 3) {
      const pageNum = parseInt(nextDigits.join(''), 10);
      onNavigate(pageNum);
      setDigits([]);
    }
  };

  const handleClear = () => {
    setDigits([]);
  };

  const handlePageDelta = (delta: number) => {
    const currentIndex = NAVIGABLE_PAGES.indexOf(currentPage);
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + delta + NAVIGABLE_PAGES.length) % NAVIGABLE_PAGES.length;
      onNavigate(NAVIGABLE_PAGES[nextIndex]);
    } else {
      onNavigate(100);
    }
  };

  return (
    <aside className="teletext-remote-control" aria-label="Teletext Remote Handset">
      <button 
        type="button" 
        className="remote-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        📱 {isOpen ? 'HIDE REMOTE HANDSET' : 'SHOW REMOTE HANDSET'}
      </button>

      {isOpen && (
        <div className="remote-handset-body">
          <div className="remote-header">
            <span>REMOTE HANDSET</span>
            <span className="remote-buffer-display">
              P{digits.length > 0 ? digits.join('').padEnd(3, '-') : currentPage}
            </span>
          </div>

          {/* Fastext Quick Color Buttons */}
          <div className="remote-fastext-row">
            <button type="button" className="remote-btn bg-red" onClick={() => onNavigate(101)}>101 ABOUT</button>
            <button type="button" className="remote-btn bg-green" onClick={() => onNavigate(200)}>200 WORK</button>
            <button type="button" className="remote-btn bg-yellow" onClick={() => onNavigate(300)}>300 STACK</button>
            <button type="button" className="remote-btn bg-cyan" onClick={() => onNavigate(400)}>400 CONTACT</button>
          </div>

          {/* Keypad Grid 0-9 */}
          <div className="remote-keypad-grid">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button 
                key={num} 
                type="button" 
                className="remote-num-btn"
                onClick={() => handleDigitClick(num)}
              >
                {num}
              </button>
            ))}
            <button type="button" className="remote-num-btn" onClick={handleClear}>CLR</button>
            <button type="button" className="remote-num-btn" onClick={() => handleDigitClick('0')}>0</button>
            <button type="button" className="remote-num-btn" onClick={() => onNavigate(100)}>100</button>
          </div>

          {/* Navigation Controls */}
          <div className="remote-nav-row">
            <button type="button" className="remote-btn nav-btn" onClick={() => handlePageDelta(-1)}>▲ PREV PAGE</button>
            <button type="button" className="remote-btn nav-btn" onClick={() => handlePageDelta(1)}>▼ NEXT PAGE</button>
            <button type="button" className="remote-btn nav-btn" onClick={() => onSubpage(-1)}>◀ SUB</button>
            <button type="button" className="remote-btn nav-btn" onClick={() => onSubpage(1)}>SUB ▶</button>
            <button type="button" className="remote-btn nav-btn" onClick={() => onNavigate(888)}>888 A11Y</button>
          </div>
        </div>
      )}
    </aside>
  );
};
