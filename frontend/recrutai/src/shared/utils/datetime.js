const pad = (n) => String(n).padStart(2, '0');

/** Value for <input type="datetime-local"> (local time, minute precision) from a Date or ISO string. */
export function toLocalInputValue(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** The ISO (UTC) timestamp for a datetime-local input value, or null if empty/invalid. */
export function fromLocalInputValue(value) {
  if (!value) return null;
  const d = new Date(value); // datetime-local strings are parsed as local time
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Default "due" suggestion: `days` ahead at 17:00 local. */
export function defaultDueDate(now = new Date(), days = 3) {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  d.setHours(17, 0, 0, 0);
  return d;
}

/** "Oct 3, 17:00" for a due timestamp; '—' when missing. */
export function formatDue(iso, locale = 'en-GB') {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/** Validation message for a scheduled date, or null when it is acceptable. */
export function validateDue(value, now = new Date()) {
  const iso = fromLocalInputValue(value);
  if (!iso) return 'Pick a date and time.';
  if (new Date(iso).getTime() <= now.getTime()) return 'The interview date must be in the future.';
  return null;
}
