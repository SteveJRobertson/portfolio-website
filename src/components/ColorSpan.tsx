import type { TeletextColor } from '../types/teletext';

interface ColorSpanProps {
  color?: TeletextColor;
  bg?: TeletextColor;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  /** Block graphics: the background is the same colour as the foreground palette, and the foreground isn't overridden. */
  mosaic?: boolean;
}

export const ColorSpan: React.FC<ColorSpanProps> = ({
  color = 'white',
  bg,
  children,
  className = '',
  onClick,
  mosaic = false,
}) => {
  const colorClass = `c-${color}`;
  const bgClass = bg ? `${mosaic ? 'm-bg' : 'bg'}-${bg}` : '';
  
  return (
    <span className={`${colorClass} ${bgClass} ${className}`.trim()} onClick={onClick}>
      {children}
    </span>
  );
};
