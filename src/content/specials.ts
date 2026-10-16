/**
 * Dated specials (docs/seasonal/README.md): a file in `src/content/specials`
 * for each, such as Halloween, that switches on for a window of dates. While
 * one is on, its Flummox! questions replace `quiz.json`, Felix wears its
 * costume, and its copy changes apply to the pages. The site is built each
 * night, so a special comes and goes without anyone touching it.
 */

/** A copy change while the special is on: `find` in any page's text becomes `replace`. */
export interface CopyChange {
  find: string;
  replace: string;
}

export interface Special {
  /** The file's name without `.json`, such as `halloween-2026`; also its preview name. */
  name: string;
  /** The first day it's on, YYYY-MM-DD, UK time. */
  from: string;
  /** The last day it's on, YYYY-MM-DD, UK time. */
  until: string;
  /** Felix's costume, drawn by `scripts/art/felix.mjs`, such as `halloween`. */
  costume?: string;
  copy: CopyChange[];
  /** The special's Flummox! questions, in the shape of `quiz.json`. Without them the regular questions stay. */
  quiz?: unknown;
}

const SPECIAL_KEYS = ['from', 'until', 'costume', 'copy', 'quiz'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const isDate = (v: unknown): v is string => typeof v === 'string' && DATE.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

/** Today's date in the UK, YYYY-MM-DD, which decides the special that's on. */
export const ukDate = (now = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

/** Checks one special's file, returning it or the problems found. */
export const readSpecial = (name: string, data: unknown, costumes: readonly string[]): { special?: Special; errors: string[] } => {
  const where = `specials/${name}.json`;
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return { errors: [`${where}: is not a JSON object`] };
  const source = data as Record<string, unknown>;
  const errors = Object.keys(source)
    .filter((k) => !SPECIAL_KEYS.includes(k))
    .map((k) => `${where}: unknown key "${k}"; the keys are ${SPECIAL_KEYS.join(', ')}`);
  const { from, until, costume, copy, quiz } = source;
  if (!isDate(from)) errors.push(`${where}: "from" must be the first day, as YYYY-MM-DD`);
  if (!isDate(until)) errors.push(`${where}: "until" must be the last day, as YYYY-MM-DD`);
  if (isDate(from) && isDate(until) && until < from) errors.push(`${where}: "until" is before "from"`);
  if (costume !== undefined && !costumes.includes(costume as string)) {
    errors.push(`${where}: "costume" must be one Felix has pictures for: ${costumes.join(', ')}`);
  }
  if (copy !== undefined && !(Array.isArray(copy) && copy.every((c) => typeof c?.find === 'string' && c.find !== '' && typeof c?.replace === 'string'))) {
    errors.push(`${where}: "copy" must list { "find": "…", "replace": "…" } changes`);
  }
  if (errors.length) return { errors };
  return {
    special: { name, from: from as string, until: until as string, costume: costume as string | undefined, copy: (copy as CopyChange[]) ?? [], quiz },
    errors,
  };
};

/** Two specials on at once would leave it to chance which wins, so it's an error. */
export const overlapErrors = (specials: readonly Special[]): string[] => {
  const sorted = [...specials].sort((a, b) => a.from.localeCompare(b.from));
  return sorted.slice(1).flatMap((s, i) =>
    s.from <= sorted[i].until ? [`specials/${s.name}.json and specials/${sorted[i].name}.json are both on ${s.from}; their dates can't overlap`] : [],
  );
};

/** The special that's on for `date` (YYYY-MM-DD), if any. */
export const activeSpecial = (specials: readonly Special[], date: string): Special | undefined =>
  specials.find((s) => s.from <= date && date <= s.until);

/** Specials still to come or on now, for previews. */
export const currentAndUpcoming = (specials: readonly Special[], date: string): Special[] => specials.filter((s) => date <= s.until);

/**
 * Makes the copy changes in every string of a page's source, counting how
 * often each `find` matched, so a change that matches nothing can be reported.
 */
export const applyCopy = (value: unknown, copy: readonly CopyChange[], matches: number[]): unknown => {
  if (typeof value === 'string') {
    return copy.reduce((text, change, i) => {
      const parts = text.split(change.find);
      matches[i] += parts.length - 1;
      return parts.join(change.replace);
    }, value);
  }
  if (Array.isArray(value)) return value.map((v) => applyCopy(v, copy, matches));
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, applyCopy(v, copy, matches)]));
  }
  return value;
};
