import { compilePageDir, compileQuizFile } from './lib/pageFiles.ts';
import { NARROW_COLS, WIDE_COLS } from '../src/content/schema.ts';
import { missingDescriptions } from '../src/content/meta.ts';

const { pages, errors: compileErrors } = compilePageDir();
const { quiz, errors: quizErrors } = compileQuizFile();
// Search results and link previews use the page's own description (SEO SPEC §3.2.4)
const errors = [
  ...compileErrors,
  ...missingDescriptions(pages).map((page) => `page${page}.json: "description" is required (every page but 404 has one)`),
  ...quizErrors,
];

if (errors.length > 0) {
  errors.forEach((error) => console.error(`❌ ${error}`));
  console.error(`\n❌ Teletext content failed validation (${errors.length} error${errors.length === 1 ? '' : 's'}).`);
  process.exit(1);
} else {
  const subpages = pages.reduce((n, p) => n + p.wide.length, 0);
  console.log(`✅ ${pages.length} pages (${subpages} screens) fit at ${WIDE_COLS} and ${NARROW_COLS} columns, with valid tags, links and descriptions.`);
  console.log(`✅ Flummox! "${quiz!.edition}": ${quiz!.questions.length} questions, and every screen fits.`);
}
