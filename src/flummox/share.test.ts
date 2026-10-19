import { describe, expect, it } from 'vitest';
import { SHARE_NETWORKS, scoreUrl, shareMessage, shareNetworkOf } from './share';

const message = shareMessage('I scored {score}/12 on Flummox! & you?', 7);
const url = scoreUrl('https://steverobertson.dev/', 7);
const href = (name: string) => SHARE_NETWORKS.find((n) => n.name === name)!.href(message, url);

describe('share', () => {
  it('puts the score in the message and the link', () => {
    expect(message).toBe('I scored 7/12 on Flummox! & you?');
    expect(url).toBe('https://steverobertson.dev/152/score/7/');
  });

  it('builds each network link, encoding the message and the link', () => {
    const both = encodeURIComponent(`${message} ${url}`);
    expect(href('Bluesky')).toBe(`https://bsky.app/intent/compose?text=${both}`);
    expect(href('X')).toBe(`https://x.com/intent/post?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`);
    expect(href('Threads')).toBe(`https://www.threads.net/intent/post?text=${both}`);
    expect(href('Facebook')).toBe(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
    expect(href('LinkedIn')).toBe(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
    expect(href('WhatsApp')).toBe(`https://wa.me/?text=${both}`);
    expect(href('Email')).toBe(`mailto:?subject=Flummox!&body=${encodeURIComponent(`${message}\n\n${url}`)}`);
    expect(href('X')).not.toMatch(/[ &]you/);
  });
});

describe('shareNetworkOf', () => {
  it('names the network of a share link, and nothing else', () => {
    expect(SHARE_NETWORKS.map((n) => shareNetworkOf(n.href(message, url)))).toEqual(SHARE_NETWORKS.map((n) => n.name));
    expect(shareNetworkOf('https://x.com/stevejrobertson')).toBeUndefined();
    expect(shareNetworkOf('mailto:hello@steverobertson.dev')).toBeUndefined();
  });
});
