import {expect, test} from 'vitest';
import {formatDate} from './dates.ts';

test('formats Moncton time across daylight saving and date boundaries', () => {
  expect(formatDate('2026-01-15T12:00:00Z')).toContain('Jan 15, 8:00 AM');
  expect(formatDate('2026-07-15T12:00:00Z')).toContain('Jul 15, 9:00 AM');
  expect(formatDate('2026-01-15T02:00:00Z')).toContain('Jan 14, 10:00 PM');
  expect(formatDate('2026-03-08T05:59:00Z')).toContain('Mar 8, 1:59 AM');
  expect(formatDate('2026-03-08T06:00:00Z')).toContain('Mar 8, 3:00 AM');
});

test('missing and invalid dates have a display placeholder', () => {
  for (const value of [null, undefined, '', 'invalid']) {
    expect(formatDate(value)).toBe('—');
  }
});
