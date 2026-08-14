import { describe, expect, it } from 'vitest';
import { buildRecentDateLabels, buildRecentDates } from './date-navigation.component';

describe('buildRecentDateLabels', () => {
  it('builds the seven-day design window ending in Today', () => {
    expect(buildRecentDateLabels(new Date('2026-08-14T12:00:00Z'))).toEqual([
      'Sat 08',
      'Sun 09',
      'Mon 10',
      'Tue 11',
      'Wed 12',
      'Thu 13',
      'Today',
    ]);
  });

  it('builds API-safe dates for the same seven-day window', () => {
    expect(buildRecentDates(new Date('2026-08-14T12:00:00Z'))).toEqual([
      '2026-08-08',
      '2026-08-09',
      '2026-08-10',
      '2026-08-11',
      '2026-08-12',
      '2026-08-13',
      '2026-08-14',
    ]);
  });
});
