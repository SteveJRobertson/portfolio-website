import React, { useState, useEffect } from 'react';
import { ColorSpan } from './ColorSpan';

interface HeaderTickerProps {
  bufferText: string;
  currentPage: number;
}

export const HeaderTicker: React.FC<HeaderTickerProps> = ({
  bufferText,
  currentPage,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      setTimeStr(`${hours}:${mins}:${secs}`);

      const day = String(now.getDate()).padStart(2, '0');
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const monthStr = months[now.getMonth()];
      setDateStr(`${day} ${monthStr}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="teletext-row header-row" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
      <div>
        <ColorSpan color="white" bg="blue" className="px-1">
          {bufferText.padEnd(5, ' ')}
        </ColorSpan>
        <ColorSpan color="yellow"> STEVE-TEXT </ColorSpan>
        <ColorSpan color="cyan">{String(currentPage).padStart(3, '0')}</ColorSpan>
      </div>
      <div>
        <ColorSpan color="green">{dateStr} {timeStr}</ColorSpan>
      </div>
    </header>
  );
};
