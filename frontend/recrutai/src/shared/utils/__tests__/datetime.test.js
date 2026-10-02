import { toLocalInputValue, fromLocalInputValue, defaultDueDate, formatDue, validateDue } from '../datetime';

describe('datetime-local helpers', () => {
  it('formats a Date as a local datetime-local value', () => {
    expect(toLocalInputValue(new Date(2026, 9, 3, 14, 5))).toBe('2026-10-03T14:05');
    expect(toLocalInputValue(new Date(2026, 0, 9, 0, 0))).toBe('2026-01-09T00:00');
  });

  it('returns an empty string for invalid input', () => {
    expect(toLocalInputValue('nope')).toBe('');
    expect(toLocalInputValue(undefined)).toBe('');
  });

  it('round-trips a local value through ISO', () => {
    const iso = fromLocalInputValue('2026-10-03T14:05');
    expect(new Date(iso).getHours()).toBe(14);
    expect(new Date(iso).getMinutes()).toBe(5);
    expect(toLocalInputValue(iso)).toBe('2026-10-03T14:05');
  });

  it('returns null for empty or invalid values', () => {
    expect(fromLocalInputValue('')).toBeNull();
    expect(fromLocalInputValue('garbage')).toBeNull();
  });
});

describe('defaultDueDate', () => {
  it('suggests 17:00 three days ahead by default', () => {
    const d = defaultDueDate(new Date(2026, 9, 1, 9, 30));
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([2026, 9, 4, 17, 0]);
  });

  it('does not mutate its input', () => {
    const now = new Date(2026, 9, 1, 9, 30);
    defaultDueDate(now, 5);
    expect(now.getDate()).toBe(1);
  });
});

describe('formatDue / validateDue', () => {
  it('shows a dash when there is no date', () => {
    expect(formatDue(null)).toBe('—');
    expect(formatDue('bad')).toBe('—');
  });

  it('formats day, month and time', () => {
    expect(formatDue(new Date(2026, 9, 3, 14, 5).toISOString())).toMatch(/3 Oct.*14:05/);
  });

  it('rejects missing, past and accepts future dates', () => {
    const now = new Date(2026, 9, 1, 12, 0);
    expect(validateDue('', now)).toMatch(/pick/i);
    expect(validateDue('2026-09-30T10:00', now)).toMatch(/future/);
    expect(validateDue('2026-10-01T12:00', now)).toMatch(/future/);
    expect(validateDue('2026-10-02T10:00', now)).toBeNull();
  });
});
