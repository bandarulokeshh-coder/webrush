/**
 * Locale-aware formatting helpers.
 *
 * Every `Intl` formatter is constructed **once at module scope**. Building a new
 * `Intl.DateTimeFormat` per call is surprisingly expensive — the receipt grid
 * formats up to {@link RECEIPT_PAGE_SIZE} timestamps per render — so hoisting
 * them here keeps filtering and paging responsive.
 *
 * @module lib/format
 */

/** Cached date/time formatter used for receipt timestamps. */
const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Cached compact number formatter, e.g. `1250` -> `1.3K`. */
const COMPACT_FORMATTER = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/**
 * Formats an ISO-8601 timestamp for display.
 *
 * Returns the raw input if it cannot be parsed, so a malformed row in a CSV
 * degrades to showing the source text instead of `Invalid Date`.
 *
 * @param timestamp - ISO-8601 date string.
 * @returns Localised, human-readable date and time.
 */
export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return TIMESTAMP_FORMATTER.format(date);
};

/**
 * Formats an ISO-8601 timestamp as a calendar date only.
 *
 * @param timestamp - ISO-8601 date string.
 * @returns Localised date such as `8 Jul 2013`.
 */
export const formatDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * Abbreviates large counts so stat tiles never overflow on mobile.
 *
 * @param value - Raw number.
 * @returns Compact representation such as `1.3K`.
 */
export const formatCompactNumber = (value: number): string => {
  if (!Number.isFinite(value)) return '—';
  return Math.abs(value) < 1000 ? String(value) : COMPACT_FORMATTER.format(value);
};

/**
 * Formats a monetary amount with its currency code.
 *
 * @param amount - Numeric amount.
 * @param currency - ISO-4217 code; falls back to the code itself if unknown.
 * @returns Formatted string such as `₹1,250.00` or `1250 XYZ`.
 */
export const formatCurrency = (amount: number, currency: string): string => {
  if (!Number.isFinite(amount)) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Unknown/invalid currency code — fall back to a neutral representation.
    return `${amount.toFixed(2)} ${currency}`;
  }
};

/**
 * Renders a playback duration in seconds as `m:ss`.
 *
 * @param seconds - Duration in seconds.
 * @returns Formatted duration, or an empty string when unavailable.
 */
export const formatDuration = (seconds?: number): string => {
  if (seconds === undefined || !Number.isFinite(seconds) || seconds <= 0) return '';
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
};

/**
 * Renders a millisecond gap as a short human phrase.
 *
 * @param ms - Duration in milliseconds.
 * @returns Phrase such as `12 min` or `3 h 05 m`.
 */
export const formatTimeGap = (ms: number): string => {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const totalMinutes = Math.round(ms / 60_000);
  if (totalMinutes < 1) return 'under a minute';
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${String(minutes).padStart(2, '0')} m`;
};

/**
 * Renders a millisecond duration in a verbose form for insight copy.
 *
 * @param ms - Duration in milliseconds.
 * @returns Phrase such as `2 hours 15 minutes`.
 */
export const formatDurationLong = (ms: number): string => {
  const minutes = Math.round(ms / 60_000);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
  if (rest > 0) parts.push(`${rest} minute${rest === 1 ? '' : 's'}`);
  return parts.length > 0 ? parts.join(' ') : 'less than a minute';
};

/**
 * Truncates long strings for compact surfaces such as the command palette.
 *
 * @param value - Source string.
 * @param max - Maximum length before truncation.
 * @returns Possibly-truncated string ending in an ellipsis.
 */
export const truncate = (value: string, max = 60): string =>
  value.length <= max ? value : `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;

/**
 * Picks the singular or plural form of a noun for a count.
 *
 * @param count - Number the noun agrees with.
 * @param singular - Singular form.
 * @param plural - Plural form; defaults to `singular + 's'`.
 * @returns The correctly inflected noun.
 */
export const pluralize = (count: number, singular: string, plural?: string): string =>
  count === 1 ? singular : (plural ?? `${singular}s`);
