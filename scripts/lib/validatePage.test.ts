import { describe, expect, it } from 'vitest';
import { validatePage } from './validatePage.ts';

describe('validatePage', () => {
  it('accepts rows up to 38 characters including suffix', () => {
    const data = { pageNumber: 100, mainRows: [{ text: ' 101 ', suffix: 'X'.repeat(33) }] };
    expect(validatePage('page100.json', data)).toEqual([]);
  });

  it('rejects rows longer than 38 characters', () => {
    const data = { pageNumber: 100, mainRows: [{ text: 'X'.repeat(39) }] };
    const errors = validatePage('page100.json', data);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Row 1 exceeds 38 characters (length: 39)');
  });

  it('rejects pages missing required fields', () => {
    expect(validatePage('bad.json', { title: 'NOPE' })).toEqual([
      '[Validation Error] bad.json is missing required fields (pageNumber, mainRows)',
    ]);
  });
});
