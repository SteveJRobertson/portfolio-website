export const MAIN_COLUMN_WIDTH = 38;

interface RawRow {
  text?: string;
  suffix?: string;
}

/** Returns human-readable errors for one page JSON file; empty when valid. */
export const validatePage = (file: string, data: unknown): string[] => {
  const page = data as { pageNumber?: unknown; mainRows?: unknown };
  if (!page || !page.pageNumber || !Array.isArray(page.mainRows)) {
    return [`[Validation Error] ${file} is missing required fields (pageNumber, mainRows)`];
  }

  const errors: string[] = [];
  (page.mainRows as RawRow[]).forEach((row, index) => {
    const totalText = (row.text || '') + (row.suffix || '');
    if (totalText.length > MAIN_COLUMN_WIDTH) {
      errors.push(
        `[Line Length Error] ${file} Row ${index + 1} exceeds ${MAIN_COLUMN_WIDTH} characters (length: ${totalText.length}): "${totalText}"`,
      );
    }
  });
  return errors;
};
