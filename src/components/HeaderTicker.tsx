import React, { useState, useEffect } from 'react';
import { GridLine } from './GridLine';
import { formatHeader } from '../display/header';

interface HeaderTickerProps {
  bufferText: string;
  currentPage: number;
  cols: number;
}

/** Row 1 of the grid: page buffer, service name, page number and clock. */
export const HeaderTicker: React.FC<HeaderTickerProps> = ({
  bufferText,
  currentPage,
  cols,
}) => {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="tt-header" style={{ display: 'contents' }}>
      <GridLine row={1} width={cols} content={formatHeader({ bufferText, currentPage, now, cols })} />
    </header>
  );
};
