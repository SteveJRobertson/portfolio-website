import type { TeletextColor } from '../types/teletext';

interface TeletextCharProps {
  char: string;
  color?: TeletextColor;
  bg?: TeletextColor;
  doubleHeight?: boolean;
}

export const TeletextChar: React.FC<TeletextCharProps> = ({
  char,
  color = 'white',
  bg,
  doubleHeight = false,
}) => {
  const colorClass = `c-${color}`;
  const bgClass = bg ? `bg-${bg}` : '';
  const heightStyle = doubleHeight ? { transform: 'scaleY(2)', transformOrigin: 'top' } : {};

  return (
    <span 
      className={`${colorClass} ${bgClass}`.trim()} 
      style={{ display: 'inline-block', width: '1ch', ...heightStyle }}
    >
      {char}
    </span>
  );
};
