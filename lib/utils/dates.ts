import {CONFIG} from '#lib/config.ts';

export const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: CONFIG.TIMEZONE,
};

const formatter = new Intl.DateTimeFormat('en-US', DATE_FORMAT_OPTIONS);

/** Format a UTC date string for display in the configured timezone. */
export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : formatter.format(date);
}
