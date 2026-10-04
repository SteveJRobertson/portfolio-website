import React from 'react';

interface TeletextScreenProps {
  children: React.ReactNode;
  ariaLabel?: string;
}

export const TeletextScreen: React.FC<TeletextScreenProps> = ({
  children,
  ariaLabel = 'Teletext CRT Display',
}) => {
  return (
    <main className="teletext-screen" aria-label={ariaLabel}>
      {children}
    </main>
  );
};
