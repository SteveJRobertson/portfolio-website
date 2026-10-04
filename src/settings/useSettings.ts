import { useCallback, useState } from 'react';

export interface Settings {
  /** Show every page as a plain, high-contrast reader view (SPEC §9). */
  textMode: boolean;
  /** Number and letter shortcuts. On by default; can be turned off for speech-input users. */
  shortcuts: boolean;
  /** The CRT scanline and glow effect. Null until the visitor chooses: see `crtEffectOn`. */
  crt: boolean | null;
}

export const DEFAULT_SETTINGS: Settings = { textMode: false, shortcuts: true, crt: null };

/**
 * Whether to draw the CRT effect: the visitor's choice, or on unless they've
 * asked their system for reduced motion or more contrast.
 */
export const crtEffectOn = (crt: boolean | null, prefersPlain: boolean): boolean => crt ?? !prefersPlain;

export const SETTINGS_KEY = 'steve-text:settings';

/** Reads saved settings. Storage can be missing or throw (private windows, blocked site data), so fall back to the defaults. */
export const loadSettings = (): Settings => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<Record<keyof Settings, unknown>>;
    return {
      textMode: typeof saved.textMode === 'boolean' ? saved.textMode : DEFAULT_SETTINGS.textMode,
      shortcuts: typeof saved.shortcuts === 'boolean' ? saved.shortcuts : DEFAULT_SETTINGS.shortcuts,
      crt: typeof saved.crt === 'boolean' ? saved.crt : DEFAULT_SETTINGS.crt,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const saveSettings = (settings: Settings) => {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Not saved, but the choice still applies for this visit.
  }
};

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const update = useCallback((change: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...change };
      saveSettings(next);
      return next;
    });
  }, []);

  return [settings, update] as const;
};
