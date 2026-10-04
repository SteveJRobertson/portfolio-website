import React, { useRef, useEffect } from 'react';
import type { TeletextColor } from '../types/teletext';

const TELETEXT_PALETTE: { name: TeletextColor; rgb: [number, number, number] }[] = [
  { name: 'black', rgb: [12, 12, 12] },
  { name: 'red', rgb: [255, 51, 51] },
  { name: 'green', rgb: [0, 255, 0] },
  { name: 'yellow', rgb: [255, 255, 0] },
  { name: 'blue', rgb: [77, 121, 255] },
  { name: 'magenta', rgb: [255, 0, 255] },
  { name: 'cyan', rgb: [0, 255, 255] },
  { name: 'white', rgb: [255, 255, 255] },
];

const findClosestColor = (r: number, g: number, b: number): [number, number, number] => {
  let minDistance = Infinity;
  let closest = TELETEXT_PALETTE[0].rgb;

  for (const item of TELETEXT_PALETTE) {
    const dr = r - item.rgb[0];
    const dg = g - item.rgb[1];
    const db = b - item.rgb[2];
    const dist = dr * dr + dg * dg + db * db;
    if (dist < minDistance) {
      minDistance = dist;
      closest = item.rgb;
    }
  }

  return closest;
};

interface TeletextCanvasImageProps {
  src: string;
  alt: string;
  widthCols?: number;
  heightRows?: number;
}

export const TeletextCanvasImage: React.FC<TeletextCanvasImageProps> = ({
  src,
  alt,
  widthCols = 36,
  heightRows = 12,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = src;

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Offscreen low-res sampling canvas
      const offCanvas = document.createElement('canvas');
      offCanvas.width = widthCols;
      offCanvas.height = heightRows;
      const offCtx = offCanvas.getContext('2d');
      if (!offCtx) return;

      // Draw image scaled down to low resolution grid
      offCtx.drawImage(img, 0, 0, widthCols, heightRows);
      const imgData = offCtx.getImageData(0, 0, widthCols, heightRows);
      const data = imgData.data;

      // Map pixels to Teletext 8-color palette
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const [cr, cg, cb] = findClosestColor(r, g, b);
        data[i] = cr;
        data[i + 1] = cg;
        data[i + 2] = cb;
      }

      offCtx.putImageData(imgData, 0, 0);

      // Render low-res posterized canvas onto main pixelated canvas
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(offCanvas, 0, 0, canvas.width, canvas.height);
    };
  }, [src, widthCols, heightRows]);

  return (
    <div className="teletext-image-container" style={{ margin: '0.4em 0' }}>
      <canvas 
        ref={canvasRef} 
        width={widthCols * 10} 
        height={heightRows * 10}
        aria-label={alt}
        style={{
          width: `${widthCols}ch`,
          height: `${heightRows * 1.2}em`,
          imageRendering: 'pixelated',
          display: 'block',
          border: '1px solid #333333',
          backgroundColor: '#0c0c0c',
        }}
      />
    </div>
  );
};
