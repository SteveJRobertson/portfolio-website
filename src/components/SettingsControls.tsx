import React from 'react';
import type { Settings } from '../settings/useSettings';

interface SettingsControlsProps {
  settings: Settings;
  onChange: (change: Partial<Settings>) => void;
  /** Whether the CRT effect is showing (the saved choice, or the default from system settings). Left out in Text mode, which never shows it. */
  crtOn?: boolean;
  className?: string;
}

/** The page 888 switches (SPEC §3, §9): Text mode, keyboard shortcuts and the CRT effect, as toggle buttons. */
export const SettingsControls: React.FC<SettingsControlsProps> = ({ settings, onChange, crtOn, className }) => (
  <div role="group" aria-label="Accessibility settings" className={['settings', className].filter(Boolean).join(' ')}>
    <button
      type="button"
      className="settings__toggle"
      aria-pressed={settings.textMode}
      onClick={() => onChange({ textMode: !settings.textMode })}
    >
      TEXT MODE <span aria-hidden="true">{settings.textMode ? 'ON' : 'OFF'}</span>
    </button>
    <button
      type="button"
      className="settings__toggle"
      aria-pressed={settings.shortcuts}
      onClick={() => onChange({ shortcuts: !settings.shortcuts })}
    >
      SHORTCUTS <span aria-hidden="true">{settings.shortcuts ? 'ON' : 'OFF'}</span>
    </button>
    {crtOn !== undefined && (
      <button type="button" className="settings__toggle" aria-pressed={crtOn} onClick={() => onChange({ crt: !crtOn })}>
        CRT EFFECT <span aria-hidden="true">{crtOn ? 'ON' : 'OFF'}</span>
      </button>
    )}
  </div>
);
