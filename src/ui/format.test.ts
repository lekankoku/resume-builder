import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime } from './format';

describe('format', () => {
  it('formats a calendar date on that same day regardless of time zone', () => {
    expect(formatDate('2026-03-01')).toBe(new Date(2026, 2, 1).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }));
  });

  it('formats a timestamp as a short date', () => {
    const iso = new Date(2026, 9, 29, 14, 5).toISOString();

    expect(formatDate(iso)).toBe(new Date(2026, 9, 29).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }));
  });

  it('formats a timestamp with date and time', () => {
    const date = new Date(2026, 9, 29, 14, 5);

    expect(formatDateTime(date.toISOString())).toBe(
      date.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    );
  });
});
