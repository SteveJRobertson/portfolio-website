import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { compilePages, type CompileResult } from '../../src/content/compile.ts';
import { compileQuiz } from '../../src/content/flummox/quiz.ts';
import type { CompiledQuiz } from '../../src/content/flummox/types.ts';
import type { RgbaImage } from '../../src/content/mosaic.ts';

export const PAGES_DIR = path.resolve(import.meta.dirname, '../../src/content/pages');
export const IMAGES_DIR = path.resolve(import.meta.dirname, '../../src/content/images');
export const QUIZ_FILE = path.resolve(import.meta.dirname, '../../src/content/flummox/quiz.json');

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

/** Reads and compiles the Flummox! questions (docs/flummox/SPEC.md §7). A file that isn't valid JSON is reported, not thrown. */
export const compileQuizFile = (file = QUIZ_FILE, imagesDir = IMAGES_DIR): { quiz?: CompiledQuiz; errors: string[]; files: string[] } => {
  const errors: string[] = [];
  const pictures = readImages(imagesDir, errors);
  let data: unknown;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (error) {
    return { errors: [...errors, `quiz.json: ${(error as Error).message}`], files: [file] };
  }
  const result = compileQuiz(data, pictures.images);
  return { ...result, errors: [...errors, ...result.errors], files: [file, ...pictures.files] };
};
