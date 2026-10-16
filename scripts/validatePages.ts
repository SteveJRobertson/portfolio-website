import { compilePageDir, compileQuizFile, compileSpecialQuiz, readSpecialsDir, seasonDate, IMAGES_DIR, PAGES_DIR } from './lib/pageFiles.ts';
import { activeSpecial } from '../src/content/specials.ts';
import { NARROW_COLS, WIDE_COLS } from '../src/content/schema.ts';
import { missingDescriptions } from '../src/content/meta.ts';

const { pages, errors: compileErrors } = compilePageDir();
const { quiz, errors: quizErrors } = compileQuizFile();
// Every dated special must work on its days, whatever today is (docs/seasonal/README.md)
const { specials, errors: specialErrors } = readSpecialsDir();
const specialChecks = specials.flatMap((special) => [
  ...compilePageDir(PAGES_DIR, IMAGES_DIR, special).errors,
  ...(quiz ? compileSpecialQuiz(special, quiz).errors : []),
]);
// Search results and link previews use the page's own description (SEO SPEC §3.2.4)
const errors = [
  ...compileErrors,
  ...missingDescriptions(pages).map((page) => `page${page}.json: "description" is required (every page but 404 has one)`),
  ...quizErrors,
  ...specialErrors,
  ...specialChecks,
];

if (errors.length > 0) {
  errors.forEach((error) => console.error(`❌ ${error}`));
  console.error(`\n❌ Teletext content failed validation (${errors.length} error${errors.length === 1 ? '' : 's'}).`);
  process.exit(1);
} else {
  const subpages = pages.reduce((n, p) => n + p.wide.length, 0);
  console.log(`✅ ${pages.length} pages (${subpages} screens) fit at ${WIDE_COLS} and ${NARROW_COLS} columns, with valid tags, links and descriptions.`);
  console.log(`✅ Flummox! "${quiz!.edition}": ${quiz!.questions.length} questions, and every screen fits.`);
  for (const s of specials) console.log(`✅ Special "${s.name}" (${s.from} to ${s.until}) fits too.`);
  const on = activeSpecial(specials, seasonDate());
  console.log(on ? `Building for ${seasonDate()}: "${on.name}" is on.` : `Building for ${seasonDate()}: no special is on.`);
}
