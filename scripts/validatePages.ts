import fs from 'fs';
import path from 'path';

const PAGES_DIR = path.join(process.cwd(), 'src', 'content', 'pages');

let hasErrors = false;

const files = fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith('.json'));

files.forEach((file) => {
  const filePath = path.join(PAGES_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  if (!data.pageNumber || !data.mainRows) {
    console.error(`❌ [Validation Error] ${file} is missing required fields (pageNumber, mainRows)`);
    hasErrors = true;
    return;
  }

  data.mainRows.forEach((row: { text: string; suffix?: string }, index: number) => {
    const totalText = (row.text || '') + (row.suffix || '');
    if (totalText.length > 38) {
      console.error(`❌ [Line Length Error] ${file} Row ${index + 1} exceeds 38 characters (length: ${totalText.length}): "${totalText}"`);
      hasErrors = true;
    }
  });
});

if (hasErrors) {
  console.error('\n❌ Page JSON Validation Failed!');
  process.exit(1);
} else {
  console.log('✅ All Teletext Page JSON files validated successfully! Zero line length overflow.');
}
