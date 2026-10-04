import type { Meta, StoryObj } from '@storybook/react-vite';

// Mosaics are astral code points (surrogate pairs), so keep them as an array rather than slicing a string.
const sextants = Array.from({ length: 60 }, (_, i) => String.fromCodePoint(0x1fb00 + i));

const CharacterSet = () => (
  <div
    style={{
      background: 'var(--tt-black)',
      color: 'var(--tt-white)',
      fontFamily: 'var(--tt-font)',
      fontSize: 24,
      lineHeight: 1.25,
      whiteSpace: 'pre',
      padding: '1rem',
    }}
  >
    <div className="c-yellow">BEDSTEAD (MODE 7 / SAA5050)</div>
    <div>ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
    <div>abcdefghijklmnopqrstuvwxyz</div>
    <div>0123456789 !"#$%&amp;'()*+,-./:;&lt;=&gt;?@</div>
    <div className="c-cyan">{'0123456789'.repeat(4)}</div>
    <div className="c-white">^ 40 columns: 1ch = 0.6em</div>
    <div className="c-yellow">MOSAIC SEXTANTS U+1FB00</div>
    <div className="c-green">{sextants.slice(0, 30).join('')}</div>
    <div className="c-green">{sextants.slice(30).join('')}</div>
  </div>
);

const meta: Meta<typeof CharacterSet> = {
  title: 'Tokens/Typography',
  component: CharacterSet,
};

export default meta;

export const Bedstead: StoryObj<typeof CharacterSet> = {};
