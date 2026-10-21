import { describe, expect, it } from 'vitest';
import { activeSpecial, applyCopy, currentAndUpcoming, overlapErrors, readSpecial, ukDate, type Special } from './specials';
import { readSpecialsDir } from '../../scripts/lib/pageFiles';

const special = (name: string, from: string, until: string): Special => ({ name, from, until, copy: [] });

describe('dated specials', () => {
  it('reads the real files without problems', () => {
    expect(readSpecialsDir().errors).toEqual([]);
  });

  it('takes the date in the UK, not UTC', () => {
    // 23:30 UTC on 31 Oct 2026 is still 31 Oct in the UK (GMT); in summer 23:30 UTC is the next day (BST)
    expect(ukDate(new Date('2026-10-31T23:30:00Z'))).toBe('2026-10-31');
    expect(ukDate(new Date('2026-06-30T23:30:00Z'))).toBe('2026-07-01');
  });

  it('is on from its first day to its last, inclusive', () => {
    const halloween = special('halloween', '2026-10-27', '2026-10-31');
    expect(activeSpecial([halloween], '2026-10-26')).toBeUndefined();
    expect(activeSpecial([halloween], '2026-10-27')).toBe(halloween);
    expect(activeSpecial([halloween], '2026-10-31')).toBe(halloween);
    expect(activeSpecial([halloween], '2026-11-01')).toBeUndefined();
  });

  it('previews the ones on now or still to come', () => {
    const old = special('old', '2025-10-27', '2025-10-31');
    const next = special('next', '2026-12-20', '2026-12-26');
    expect(currentAndUpcoming([old, next], '2026-10-16')).toEqual([next]);
  });

  it("won't let two be on at once", () => {
    expect(overlapErrors([special('a', '2026-10-27', '2026-10-31'), special('b', '2026-10-31', '2026-11-02')])).toHaveLength(1);
    expect(overlapErrors([special('a', '2026-10-27', '2026-10-31'), special('b', '2026-11-01', '2026-11-02')])).toEqual([]);
  });

  it('checks the file', () => {
    expect(readSpecial('x', { from: '2026-10-31', until: '2026-10-27' }, []).errors).toContain('specials/x.json: "until" is before "from"');
    expect(readSpecial('x', { from: '27 Oct', until: '2026-10-31' }, []).errors).toContain('specials/x.json: "from" must be the first day, as YYYY-MM-DD');
    expect(readSpecial('x', { from: '2026-10-27', until: '2026-10-31', costume: 'santa' }, ['halloween']).errors).toEqual([
      'specials/x.json: "costume" must be one Felix has pictures for: halloween',
    ]);
    expect(readSpecial('x', { from: '2026-10-27', until: '2026-10-31', colour: 'orange' }, []).errors[0]).toMatch(/unknown key "colour"/);
  });

  it('changes copy in every string of a page, and counts the matches', () => {
    const matches = [0, 0];
    const page = { promo: { text: '{white}PLAY FLUMMOX!{/}', page: 152 }, rows: ['NEW quiz', { text: 'NEW' }] };
    const changed = applyCopy(page, [{ find: 'NEW', replace: 'SPOOKY' }, { find: 'absent', replace: '' }], matches);
    expect(changed).toEqual({ promo: { text: '{white}PLAY FLUMMOX!{/}', page: 152 }, rows: ['SPOOKY quiz', { text: 'SPOOKY' }] });
    expect(matches).toEqual([2, 0]);
  });
});
