import { compilePageDir } from './lib/pageFiles.ts';
import { NARROW_COLS, WIDE_COLS } from '../src/content/schema.ts';

const { pages, errors } = compilePageDir();

if (errors.length > 0) {
  errors.forEach((error) => console.error(`❌ ${error}`));
  console.error(`\n❌ Teletext content failed validation (${errors.length} error${errors.length === 1 ? '' : 's'}).`);
  process.exit(1);
} else {
  const subpages = pages.reduce((n, p) => n + p.wide.length, 0);
  console.log(`✅ ${pages.length} pages (${subpages} screens) fit at ${WIDE_COLS} and ${NARROW_COLS} columns, with valid tags and links.`);
}
