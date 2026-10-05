/**
 * Cookieless visit counting with Plausible (docs/seo-analytics/SPEC.md §4).
 *
 * Nothing else in the app knows which tool is behind `track`, so it can change.
 * It's off unless the build sets `VITE_PLAUSIBLE_SRC` to the site's script from
 * the Plausible dashboard (`https://plausible.io/js/pa-….js`), which only the
 * deploy does, and it stays off for visitors whose browser sends Global Privacy
 * Control or Do Not Track. Off, `track` does nothing: local dev, tests,
 * Storybook and pre-rendering never count.
 */

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
}

/** Typed or keyed-in digits, a coloured Fastext button or key, a link on the page, or the remote's other buttons. */
export type NavigateMethod = 'digits' | 'fastext' | 'link' | 'remote';

type Plausible = ((event: string, options?: { props?: Record<string, string> }) => void) & {
  q?: unknown[][];
  o?: Record<string, unknown>;
  init?: (options?: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    plausible?: Plausible;
  }
  interface Navigator {
    globalPrivacyControl?: boolean;
  }
}

/** Only Plausible's own https scripts, so a mistyped variable can't load something else. */
export const scriptSource = (src: string | undefined): string | undefined =>
  src && /^https:\/\/plausible\.io\/js\/[\w.-]+\.js$/.test(src.trim()) ? src.trim() : undefined;

/** The visitor has asked not to be tracked. */
export const optedOut = (nav: Navigator = navigator): boolean =>
  nav.globalPrivacyControl === true || nav.doNotTrack === '1';

let enabled = false;

/**
 * Loads the script once, at start-up. Plausible's stub queues calls made before
 * the script arrives; the script then counts a page view now and on every
 * History API page change, so client-side navigation is counted too.
 */
export const startAnalytics = (src = scriptSource(import.meta.env.VITE_PLAUSIBLE_SRC as string | undefined)): boolean => {
  if (enabled || !src || typeof window === 'undefined' || optedOut()) return enabled;
  const stub: Plausible =
    window.plausible ??
    Object.assign((...args: unknown[]) => {
      (stub.q = stub.q ?? []).push(args);
    });
  stub.init = stub.init ?? ((options) => (stub.o = options ?? {}));
  window.plausible = stub;
  stub.init();

  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.appendChild(script);

  document.addEventListener('click', onAddressClick, { capture: true });
  enabled = true;
  return true;
};

/** Sends a custom event, or does nothing when analytics is off. Properties are sent as strings. */
export const track = <E extends keyof Events>(event: E, props: Events[E]): void => {
  if (!enabled) return;
  const strings = Object.fromEntries(Object.entries(props).map(([k, v]) => [k, String(v)]));
  window.plausible?.(event, { props: strings });
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

export const trackOutbound = (href: string) => track('Outbound', { to: outboundName(href) });

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
  delete window.plausible;
};
