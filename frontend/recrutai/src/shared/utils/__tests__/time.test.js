import { timeAgo } from '../time';

const NOW = Date.parse('2026-10-02T12:00:00Z');
const ago = (seconds) => new Date(NOW - seconds * 1000).toISOString();

describe('timeAgo', () => {
  it('returns a dash for missing or invalid input', () => {
    expect(timeAgo(null, NOW)).toBe('—');
    expect(timeAgo('', NOW)).toBe('—');
    expect(timeAgo('not-a-date', NOW)).toBe('—');
  });

  it('says "just now" under a minute', () => {
    expect(timeAgo(ago(20), NOW)).toBe('just now');
  });

  it('uses the largest whole unit and pluralises', () => {
    expect(timeAgo(ago(90), NOW)).toBe('1 minute ago');
    expect(timeAgo(ago(3 * 3600), NOW)).toBe('3 hours ago');
    expect(timeAgo(ago(2 * 86400), NOW)).toBe('2 days ago');
    expect(timeAgo(ago(14 * 86400), NOW)).toBe('2 weeks ago');
    expect(timeAgo(ago(400 * 86400), NOW)).toBe('1 year ago');
  });

  it('never goes negative for future timestamps', () => {
    expect(timeAgo(new Date(NOW + 60000).toISOString(), NOW)).toBe('just now');
  });
});
