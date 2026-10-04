import type { Meta, StoryObj } from '@storybook/react-vite';
import { contrastRatio } from './contrast';

const BACKGROUND = '#0C0C0C';

const foreground = [
  { name: 'white', token: '--tt-white', hex: '#FFFFFF' },
  { name: 'yellow', token: '--tt-yellow', hex: '#FFFF00' },
  { name: 'cyan', token: '--tt-cyan', hex: '#00FFFF' },
  { name: 'green', token: '--tt-green', hex: '#00FF00' },
  { name: 'magenta', token: '--tt-magenta', hex: '#FF00FF' },
  { name: 'red', token: '--tt-red', hex: '#FF3333' },
  { name: 'blue', token: '--tt-blue', hex: '#4D79FF' },
];

const Palette = () => (
  <div style={{ background: BACKGROUND, padding: '1.5rem', fontFamily: 'var(--tt-font)', fontSize: 20, lineHeight: 1.6 }}>
    <div className="c-white">BACKGROUND {BACKGROUND} (--tt-black)</div>
    {foreground.map(({ name, token, hex }) => {
      const ratio = contrastRatio(hex, BACKGROUND);
      return (
        <div key={name} style={{ whiteSpace: 'pre' }}>
          <span className={`c-${name}`}>{'███ '}{name.toUpperCase().padEnd(8)}</span>
          <span className="c-white">{`${hex}  ${token.padEnd(13)} ${ratio.toFixed(1)}:1 ${ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'FAIL'}`}</span>
        </div>
      );
    })}
  </div>
);

const meta: Meta<typeof Palette> = {
  title: 'Tokens/Colour',
  component: Palette,
};

export default meta;

export const EightColourPalette: StoryObj<typeof Palette> = {};
