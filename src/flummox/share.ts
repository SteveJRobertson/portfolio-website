import type { IconName } from '../icons/icons.ts';

/**
 * Sharing a Flummox! score (docs/flummox/SPEC.md §6, Sharing): plain links to
 * each network's own share page, so nothing from the networks loads until
 * the visitor picks one.
 */

export interface ShareNetwork {
  name: string;
  icon: IconName;
  /** The network's share page for this message and link. */
  href: (message: string, url: string) => string;
}

const q = encodeURIComponent;

export const SHARE_NETWORKS: readonly ShareNetwork[] = [
  { name: 'Bluesky', icon: 'bluesky', href: (m, u) => `https://bsky.app/intent/compose?text=${q(`${m} ${u}`)}` },
  { name: 'X', icon: 'x', href: (m, u) => `https://x.com/intent/post?text=${q(m)}&url=${q(u)}` },
  { name: 'Threads', icon: 'threads', href: (m, u) => `https://www.threads.net/intent/post?text=${q(`${m} ${u}`)}` },
  { name: 'Facebook', icon: 'facebook', href: (_, u) => `https://www.facebook.com/sharer/sharer.php?u=${q(u)}` },
  { name: 'LinkedIn', icon: 'linkedin', href: (_, u) => `https://www.linkedin.com/sharing/share-offsite/?url=${q(u)}` },
  { name: 'WhatsApp', icon: 'whatsapp', href: (m, u) => `https://wa.me/?text=${q(`${m} ${u}`)}` },
  { name: 'Email', icon: 'email', href: (m, u) => `mailto:?subject=${q('Flummox!')}&body=${q(`${m}\n\n${u}`)}` },
];

/** The shared message: the template from quiz.json with the score in it. */
export const shareMessage = (template: string, score: number): string => template.replace(/\{score\}/g, String(score));

/**
 * The shared link: the score's own page, whose link preview shows the score.
 * `site` is the site's root with a trailing slash, e.g. https://steverobertson.dev/.
 */
export const scoreUrl = (site: string, score: number): string => `${site}152/score/${score}/`;

/** The score a score page's path is for, or none. */
export const scoreFromPath = (path: string): number | undefined => {
  const match = /^152\/score\/(\d{1,2})\/?$/.exec(path.replace(/^\/+/, ''));
  const score = match ? Number(match[1]) : NaN;
  return Number.isInteger(score) && score >= 0 && score <= 12 ? score : undefined;
};
