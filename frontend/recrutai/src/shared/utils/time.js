const UNITS = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "2 days ago" style label for an ISO timestamp; '—' when missing/invalid. */
export function timeAgo(iso, now = Date.now()) {
  const then = Date.parse(iso);
  if (!iso || Number.isNaN(then)) return '—';
  const seconds = Math.max(0, Math.floor((now - then) / 1000));
  for (const [name, size] of UNITS) {
    const n = Math.floor(seconds / size);
    if (n >= 1) return `${n} ${name}${n > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}
