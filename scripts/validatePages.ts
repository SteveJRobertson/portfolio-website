import fs from 'fs';
import path from 'path';
import { validatePage } from './lib/validatePage.ts';

const PAGES_DIR = path.join(process.cwd(), 'src', 'content', 'pages');

const files = fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith('.json'));

const errors = files.flatMap((file) =>
  validatePage(file, JSON.parse(fs.readFileSync(path.join(PAGES_DIR, file), 'utf-8'))),
);

if (errors.length > 0) {
  errors.forEach((error) => console.error(`❌ ${error}`));
  console.error('\n❌ Page JSON Validation Failed!');
  process.exit(1);
} else {
  console.log('✅ All Teletext Page JSON files validated successfully! Zero line length overflow.');
}
