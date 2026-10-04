import { useEffect, useRef } from 'react';

export interface HotkeyHandlers {
  /** Digits and R/G/Y/B/C. Off when the visitor turns shortcuts off on 888 (WCAG 2.1.4). */
  characterKeys: boolean;
  /** ← and →. Off in Text mode, where every sub-page is already on screen and arrows scroll. */
  arrowKeys: boolean;
  onDigit: (digit: string) => void;
  onClear: () => void;
  /** 0–3: red, green, yellow, cyan. */
  onFastext: (slot: number) => void;
  onSubpage: (delta: number) => void;
}

const FASTEXT_KEYS: Record<string, number> = { r: 0, g: 1, y: 2, b: 3, c: 3 };

const isEditable = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement);

/**
 * The single keydown listener. It adds to normal keyboard use and never
 * replaces it: keys with a modifier, and keys typed into form fields, are left
 * alone (SPEC §9).
 */
export const useHotkeys = (handlers: HotkeyHandlers) => {
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isEditable(e.target)) return;
      const h = latest.current;
      const key = e.key.toLowerCase();

      if (key === 'escape') return h.onClear();
      if (e.shiftKey) return;
      if (h.arrowKeys && (key === 'arrowleft' || key === 'arrowright')) return h.onSubpage(key === 'arrowleft' ? -1 : 1);
      if (!h.characterKeys) return;
      if (/^\d$/.test(key)) return h.onDigit(key);
      if (key in FASTEXT_KEYS) h.onFastext(FASTEXT_KEYS[key]);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
};
