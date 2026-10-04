import { useCallback, useEffect, useState } from 'react';

/** How long the full number stays in the header before the page changes. */
export const DIGIT_DELAY_MS = 250;

export interface DigitBuffer {
  /** Header text: `P1--` while typing, otherwise `P` and the current page. */
  text: string;
  digit: (d: string) => void;
  clear: () => void;
}

/**
 * The one 3-digit buffer (SPEC §5), fed by the keyboard and the keypad alike.
 * The third digit navigates, from an effect rather than inside a state update,
 * so StrictMode can't make it navigate twice.
 */
export const useDigitBuffer = (currentPage: number, navigate: (page: number) => void): DigitBuffer => {
  const [digits, setDigits] = useState('');

  const digit = useCallback((d: string) => {
    if (!/^\d$/.test(d)) return;
    setDigits((prev) => (prev.length >= 3 ? prev : prev + d));
  }, []);

  const clear = useCallback(() => setDigits(''), []);

  useEffect(() => {
    if (digits.length < 3) return;
    const timer = setTimeout(() => {
      setDigits('');
      navigate(Number(digits));
    }, DIGIT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [digits, navigate]);

  const text = digits ? `P${digits.padEnd(3, '-')}` : `P${currentPage}`;
  return { text, digit, clear };
};
