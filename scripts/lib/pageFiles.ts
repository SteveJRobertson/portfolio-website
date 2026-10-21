import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { compilePages, type CompileResult } from '../../src/content/compile.ts';
import { COSTUMES, compileQuiz } from '../../src/content/flummox/quiz.ts';
import { activeSpecial, applyCopy, overlapErrors, readSpecial, ukDate, type Special } from '../../src/content/specials.ts';
import type { CompiledQuiz } from '../../src/content/flummox/types.ts';
import type { RgbaImage } from '../../src/content/mosaic.ts';

export const PAGES_DIR = path.resolve(import.meta.dirname, '../../src/content/pages');
export const IMAGES_DIR = path.resolve(import.meta.dirname, '../../src/content/images');
export const QUIZ_FILE = path.resolve(import.meta.dirname, '../../src/content/flummox/quiz.json');
export const SPECIALS_DIR = path.resolve(import.meta.dirname, '../../src/content/specials');

/**
 * The date the site is built for: today in the UK, or `SEASON_DATE`
 * (YYYY-MM-DD) to build it as it will be on that day.
 */
export const seasonDate = (): string => {
  const date = process.env.SEASON_DATE;
  if (date === undefined || date === '') return ukDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`SEASON_DATE must be YYYY-MM-DD, not "${date}"`);
  return date;
};

/** Reads and checks every dated special (src/content/specials). A file that isn't valid JSON is reported, not thrown. */
export const readSpecialsDir = (dir = SPECIALS_DIR): { specials: Special[]; errors: string[]; files: string[] } => {
  if (!fs.existsSync(dir)) return { specials: [], errors: [], files: [] };
  const names = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  const errors: string[] = [];
  const specials = names.flatMap((file) => {
    let data: unknown;
    try {
      data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
    } catch (error) {
      errors.push(`specials/${file}: ${(error as Error).message}`);
      return [];
    }
    const read = readSpecial(path.basename(file, '.json'), data, COSTUMES);
    errors.push(...read.errors);
    return read.special ? [read.special] : [];
  });
  return { specials, errors: [...errors, ...overlapErrors(specials)], files: names.map((f) => path.join(dir, f)) };
};

/** The special on for the build's date (`seasonDate`), if any, with any problems in the specials. */
export const specialForBuild = (dir = SPECIALS_DIR) => {
  const read = readSpecialsDir(dir);
  return { ...read, special: activeSpecial(read.specials, seasonDate()) };
};

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

/**
 * Reads every page JSON file and the images they use, and compiles them,
 * with a special's copy changes made when one is given. A file that isn't
 * valid JSON is reported, not thrown, as is a copy change that matches nothing.
 */
export const compilePageDir = (dir = PAGES_DIR, imagesDir = IMAGES_DIR, special?: Special): CompileResult & { files: string[] } => {
  const names = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  const parseErrors: string[] = [];
  const matches = (special?.copy ?? []).map(() => 0);
  const files = names.flatMap((file) => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8')) as unknown;
      return [{ file, data: special ? applyCopy(data, special.copy, matches) : data }];
    } catch (error) {
      parseErrors.push(`${file}: ${(error as Error).message}`);
      return [];
    }
  });
  special?.copy.forEach((change, i) => {
    if (!matches[i]) parseErrors.push(`specials/${special.name}.json: "${change.find}" isn't on any page, so it can't be changed`);
  });
  const pictures = readImages(imagesDir, parseErrors);
  const result = compilePages(files, pictures.images);
  return {
    ...result,
    errors: [...parseErrors, ...result.errors],
    files: [...names.map((f) => path.join(dir, f)), ...pictures.files],
  };
};

/**
 * Compiles a special's Flummox! questions, with Felix in its costume. The
 * link-preview cards stay the regular quiz's, so the committed share images
 * don't change with the date.
 */
export const compileSpecialQuiz = (special: Special, regular: CompiledQuiz, imagesDir = IMAGES_DIR): { quiz?: CompiledQuiz; errors: string[] } => {
  if (special.quiz === undefined && special.costume === undefined) return { quiz: regular, errors: [] };
  const errors: string[] = [];
  const pictures = readImages(imagesDir, errors);
  // A special with a costume but no questions of its own dresses Felix for the regular ones
  const data = special.quiz ?? (JSON.parse(fs.readFileSync(QUIZ_FILE, 'utf-8')) as unknown);
  const file = special.quiz ? `specials/${special.name}.json quiz` : `quiz.json (as specials/${special.name}.json)`;
  const result = compileQuiz(data, pictures.images, { file, costume: special.costume });
  return { quiz: result.quiz && { ...result.quiz, cards: regular.cards }, errors: [...errors, ...result.errors] };
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
