import type { TeletextColor } from '../types/teletext';

interface ColorSpanProps {
  color?: TeletextColor;
  bg?: TeletextColor;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const ColorSpan: React.FC<ColorSpanProps> = ({
  color = 'white',
  bg,
  children,
  className = '',
  onClick,
}) => {
  const colorClass = `c-${color}`;
  const bgClass = bg ? `bg-${bg}` : '';
  
  return (
    <span className={`${colorClass} ${bgClass} ${className}`.trim()} onClick={onClick}>
      {children}
    </span>
  );
};
