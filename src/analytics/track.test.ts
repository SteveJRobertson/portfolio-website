import { afterEach, describe, expect, it, vi } from 'vitest';
import { isLocal, optedOut, outboundName, resetAnalytics, startAnalytics, track, websiteId } from './track';

const ID = '94db1cb1-74f4-4a40-ad6c-962362670409';
const HOST = 'steverobertson.dev';
const SCRIPT = 'script[src="https://cloud.umami.is/script.js"]';

/** Stands in for the loaded script, recording what it's sent. */
const fakeUmami = () => {
  const sent: unknown[][] = [];
  window.umami = { track: (...args: unknown[]) => void sent.push(args) };
  return sent;
};

afterEach(() => {
  resetAnalytics();
  document.head.querySelectorAll('script').forEach((s) => s.remove());
  vi.unstubAllGlobals();
});

describe('websiteId', () => {
  it('accepts an Umami website ID', () => expect(websiteId(` ${ID} `)).toBe(ID));
  it('is off when unset or not an ID', () => {
    expect(websiteId(undefined)).toBeUndefined();
    expect(websiteId('')).toBeUndefined();
    expect(websiteId('not-an-id')).toBeUndefined();
  });
});

describe('isLocal', () => {
  it('spots local previews', () => {
    expect(isLocal('localhost')).toBe(true);
    expect(isLocal('127.0.0.1')).toBe(true);
    expect(isLocal('steverobertson.dev')).toBe(false);
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
    expect(document.head.querySelector('script')).toBeNull();
  });

  it('loads the script once and sends events with string values', () => {
    expect(startAnalytics(ID, HOST)).toBe(true);
    expect(startAnalytics(ID, HOST)).toBe(true);
    const scripts = document.head.querySelectorAll<HTMLScriptElement>(SCRIPT);
    expect(scripts).toHaveLength(1);
    expect(scripts[0].dataset.websiteId).toBe(ID);
    const sent = fakeUmami();
    track('Setting', { name: 'crt', on: false });
    expect(sent).toEqual([['Setting', { name: 'crt', on: 'false' }]]);
  });

  it('stays off on a local preview', () => {
    expect(startAnalytics(ID, 'localhost')).toBe(false);
  });

  it('stays off for visitors who opt out', () => {
    vi.stubGlobal('navigator', { ...navigator, globalPrivacyControl: true });
    expect(startAnalytics(ID, HOST)).toBe(false);
    expect(document.head.querySelector('script')).toBeNull();
  });

  it('counts clicks on email and web links outside the site', () => {
    startAnalytics(ID, HOST);
    const sent = fakeUmami();
    document.body.innerHTML = '<a href="mailto:a@b.c">mail</a><a href="/110/">here</a>';
    const [mail, local] = document.body.querySelectorAll('a');
    local.addEventListener('click', (e) => e.preventDefault());
    mail.addEventListener('click', (e) => e.preventDefault());
    local.click();
    mail.click();
    expect(sent).toEqual([['Outbound', { to: 'email' }]]);
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
