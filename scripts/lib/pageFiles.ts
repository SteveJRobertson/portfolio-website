import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { compilePages, type CompileResult } from '../../src/content/compile.ts';
import type { RgbaImage } from '../../src/content/mosaic.ts';

export const PAGES_DIR = path.resolve(import.meta.dirname, '../../src/content/pages');
export const IMAGES_DIR = path.resolve(import.meta.dirname, '../../src/content/images');

/** Decodes every PNG in the images folder, by name without the extension. A file that can't be read is reported. */
const readImages = (dir: string, errors: string[]): { images: Record<string, RgbaImage>; files: string[] } => {
  if (!fs.existsSync(dir)) return { images: {}, files: [] };
  const names = fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
  const images: Record<string, RgbaImage> = {};
  for (const name of names) {
    try {
      images[path.basename(name, '.png')] = PNG.sync.read(fs.readFileSync(path.join(dir, name)));
    } catch (error) {
      errors.push(`images/${name}: ${(error as Error).message}`);
    }
  }
  return { images, files: names.map((f) => path.join(dir, f)) };
};

/** Reads every page JSON file and the images they use, and compiles them. A file that isn't valid JSON is reported, not thrown. */
export const compilePageDir = (dir = PAGES_DIR, imagesDir = IMAGES_DIR): CompileResult & { files: string[] } => {
  const names = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  const parseErrors: string[] = [];
  const files = names.flatMap((file) => {
    try {
      return [{ file, data: JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8')) as unknown }];
    } catch (error) {
      parseErrors.push(`${file}: ${(error as Error).message}`);
      return [];
    }
  });
  const pictures = readImages(imagesDir, parseErrors);
  const result = compilePages(files, pictures.images);
  return {
    ...result,
    errors: [...parseErrors, ...result.errors],
    files: [...names.map((f) => path.join(dir, f)), ...pictures.files],
  };
};
