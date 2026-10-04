import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compilePages, type CompileResult } from '../../src/content/compile.ts';

export const PAGES_DIR = fileURLToPath(new URL('../../src/content/pages', import.meta.url));

/** Reads every page JSON file and compiles them. A file that isn't valid JSON is reported, not thrown. */
export const compilePageDir = (dir = PAGES_DIR): CompileResult & { files: string[] } => {
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
  const result = compilePages(files);
  return { ...result, errors: [...parseErrors, ...result.errors], files: names.map((f) => path.join(dir, f)) };
};
