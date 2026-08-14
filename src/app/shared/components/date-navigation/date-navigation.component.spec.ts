import { describe, expect, it } from 'vitest';
import { buildRecentDateLabels } from './date-navigation.component';

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
});
