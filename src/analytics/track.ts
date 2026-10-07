/**
 * Cookieless visit counting with Umami Cloud (docs/seo-analytics/SPEC.md §4, ANALYTICS.md).
 *
 * Nothing else in the app knows which tool is behind `track`, so it can change.
 * It's off unless the build sets `VITE_UMAMI_WEBSITE_ID` to the site's ID from
 * the Umami dashboard, which only the deploy does, and it stays off for
 * visitors whose browser sends Global Privacy Control or Do Not Track. Off,
 * `track` does nothing: local dev, tests, Storybook and pre-rendering never count.
 */

import { shareNetworkOf } from '../flummox/share';

const SCRIPT_SRC = 'https://cloud.umami.is/script.js';

/** The custom events and their properties (SPEC §4.2). Page views are counted by the script itself. */
export interface Events {
  /** How the visitor changed page. */
  Navigate: { method: NavigateMethod };
  /** A switch on page 888. */
  Setting: { name: 'text mode' | 'shortcuts' | 'crt'; on: boolean };
  /** An email or web address opened. */
  Outbound: { to: string };
  /** A page number or path that doesn't exist. */
  'Not found': { path: string };
  /** A Flummox! game begun, from question 1. */
  'Flummox start': { edition: string };
  /** A wrong answer in Flummox!: which question catches people out. */
  'Flummox flummoxed': { edition: string; question: number };
  /** A Flummox! game finished, and its score. */
  'Flummox finish': { edition: string; score: number };
  /** A Flummox! score shared: a network, `copy`, or `share sheet`. */
  'Flummox share': { network: string };
}

/** Typed or keyed-in digits, a coloured Fastext button or key, a link on the page, or the remote's other buttons. */
export type NavigateMethod = 'digits' | 'fastext' | 'link' | 'remote';

interface Umami {
  track: (event: string, data?: Record<string, string>) => void;
}

declare global {
  interface Window {
    umami?: Umami;
  }
  interface Navigator {
    globalPrivacyControl?: boolean;
  }
}

/** Umami website IDs are UUIDs; anything else (unset, mistyped) leaves analytics off. */
export const websiteId = (id: string | undefined): string | undefined =>
  id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim()) ? id.trim() : undefined;

/** The visitor has asked not to be tracked. */
export const optedOut = (nav: Navigator = navigator): boolean =>
  nav.globalPrivacyControl === true || nav.doNotTrack === '1';

/** A local preview of a deploy build isn't a visit. */
export const isLocal = (host: string): boolean => host === 'localhost' || host === '127.0.0.1' || host === '[::1]';

let enabled = false;

/**
 * Loads the script once, at start-up. It counts a page view when it arrives and
 * on every History API page change, so client-side navigation is counted too.
 * Events sent before it arrives are dropped, which only loses the odd click.
 */
export const startAnalytics = (
  id = websiteId(import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined),
  host = typeof window === 'undefined' ? '' : window.location.hostname,
): boolean => {
  if (enabled || !id || typeof window === 'undefined' || optedOut() || isLocal(host)) return enabled;
  const script = document.createElement('script');
  script.defer = true;
  script.src = SCRIPT_SRC;
  script.dataset.websiteId = id;
  script.dataset.doNotTrack = 'true';
  document.head.appendChild(script);

  document.addEventListener('click', onAddressClick, { capture: true });
  enabled = true;
  return true;
};

/** Sends a custom event, or does nothing when analytics is off. Properties are sent as strings. */
export const track = <E extends keyof Events>(event: E, props: Events[E]): void => {
  if (!enabled) return;
  const strings = Object.fromEntries(Object.entries(props).map(([k, v]) => [k, String(v)]));
  window.umami?.track(event, strings);
};

/** Where an address leads, in words that read well in the dashboard: email, LinkedIn, GitHub, or the site's host. */
export const outboundName = (href: string): string => {
  if (href.startsWith('mailto:')) return 'email';
  try {
    const host = new URL(href).hostname.replace(/^www\./, '');
    if (host === 'linkedin.com' || host.endsWith('.linkedin.com')) return 'LinkedIn';
    if (host === 'github.com') return 'GitHub';
    return host;
  } catch {
    return 'other';
  }
};

/** Following an address: a Flummox! share link counts as a share, anything else as leaving the site. */
export const trackOutbound = (href: string) => {
  const network = shareNetworkOf(href);
  if (network) track('Flummox share', { network });
  else track('Outbound', { to: outboundName(href) });
};

/** Addresses in the text view and the hidden mirror are plain links; the Teletext screen reports its own through `trackOutbound`. */
const onAddressClick = (e: MouseEvent) => {
  const link = (e.target as Element | null)?.closest?.('a[href]');
  const href = link?.getAttribute('href');
  if (href && (href.startsWith('mailto:') || /^https?:\/\//.test(href)) && !href.startsWith(window.location.origin)) {
    trackOutbound(href);
  }
};

/** For tests: back to off. */
export const resetAnalytics = () => {
  enabled = false;
  document.removeEventListener('click', onAddressClick, { capture: true });
  delete window.umami;
};
