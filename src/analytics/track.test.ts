import { afterEach, describe, expect, it, vi } from 'vitest';
import { optedOut, outboundName, resetAnalytics, scriptSource, startAnalytics, track } from './track';

const SRC = 'https://plausible.io/js/pa-abc123.js';

afterEach(() => {
  resetAnalytics();
  document.head.querySelectorAll('script').forEach((s) => s.remove());
  vi.unstubAllGlobals();
});

describe('scriptSource', () => {
  it('accepts a Plausible script URL', () => expect(scriptSource(` ${SRC} `)).toBe(SRC));
  it('is off when unset or not Plausible', () => {
    expect(scriptSource(undefined)).toBeUndefined();
    expect(scriptSource('')).toBeUndefined();
    expect(scriptSource('https://evil.example/js/pa-1.js')).toBeUndefined();
    expect(scriptSource('http://plausible.io/js/pa-1.js')).toBeUndefined();
  });
});

describe('optedOut', () => {
  it('honours Global Privacy Control and Do Not Track', () => {
    expect(optedOut({ globalPrivacyControl: true } as Navigator)).toBe(true);
    expect(optedOut({ doNotTrack: '1' } as Navigator)).toBe(true);
    expect(optedOut({ doNotTrack: null } as Navigator)).toBe(false);
  });
});

describe('track', () => {
  it('does nothing while analytics is off', () => {
    expect(startAnalytics(undefined)).toBe(false);
    track('Navigate', { method: 'digits' });
    expect(window.plausible).toBeUndefined();
    expect(document.head.querySelector('script')).toBeNull();
  });

  it('loads the script once and queues events as strings until it arrives', () => {
    expect(startAnalytics(SRC)).toBe(true);
    expect(startAnalytics(SRC)).toBe(true);
    expect(document.head.querySelectorAll(`script[src="${SRC}"]`)).toHaveLength(1);
    track('Setting', { name: 'crt', on: false });
    expect(window.plausible?.q).toEqual([['Setting', { props: { name: 'crt', on: 'false' } }]]);
  });

  it('stays off for visitors who opt out', () => {
    vi.stubGlobal('navigator', { ...navigator, globalPrivacyControl: true });
    expect(startAnalytics(SRC)).toBe(false);
    expect(document.head.querySelector('script')).toBeNull();
  });

  it('counts clicks on email and web links outside the site', () => {
    startAnalytics(SRC);
    document.body.innerHTML = '<a href="mailto:a@b.c">mail</a><a href="/110/">here</a>';
    const [mail, local] = document.body.querySelectorAll('a');
    local.addEventListener('click', (e) => e.preventDefault());
    mail.addEventListener('click', (e) => e.preventDefault());
    local.click();
    mail.click();
    expect(window.plausible?.q).toEqual([['Outbound', { props: { to: 'email' } }]]);
  });
});

describe('outboundName', () => {
  it('names the usual places and falls back to the host', () => {
    expect(outboundName('mailto:steve@example.com')).toBe('email');
    expect(outboundName('https://www.linkedin.com/in/steve')).toBe('LinkedIn');
    expect(outboundName('https://github.com/SteveJRobertson')).toBe('GitHub');
    expect(outboundName('https://www.example.org/x')).toBe('example.org');
  });
});
