import React from 'react';
import type { Settings } from '../settings/useSettings';

interface SettingsControlsProps {
  settings: Settings;
  onChange: (change: Partial<Settings>) => void;
  className?: string;
}

/** The page 888 switches (SPEC §9): Text mode and keyboard shortcuts, as toggle buttons. */
export const SettingsControls: React.FC<SettingsControlsProps> = ({ settings, onChange, className }) => (
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
  </div>
);
