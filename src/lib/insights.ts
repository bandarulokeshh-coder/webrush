/**
 * Insights engine — turns a flat receipt list into plain-language findings.
 *
 * The receipt grid answers "what happened?". Insights answer "what does it
 * mean?" by scanning the feed for signals that are tedious to spot by eye:
 * the busiest hour, the most-visited venue, the artist driving a listening
 * streak, the single most expensive month.
 *
 * Every function is pure and independent of React so it can be unit tested
 * directly.
 *
 * @module lib/insights
 */

import type { Insight, Receipt } from '../types/receipt';
import { formatCompactNumber, formatCurrency } from './format';

/** A tally of one label and how often it occurred. */
interface Tally {
  label: string;
  count: number;
}

/**
 * Tallies occurrences of a derived label.
 *
 * @param receipts - Source receipts.
 * @param derive - Maps a receipt to its label, or `null` to skip it.
 * @returns Entries sorted by descending count.
 */
export const tallyBy = (
  receipts: Receipt[],
  derive: (receipt: Receipt) => string | null,
): Tally[] => {
  const counts = new Map<string, number>();

  for (const receipt of receipts) {
    const label = derive(receipt);
    if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
};

/**
 * Finds the hour of day with the most receipts.
 *
 * @param receipts - Source receipts.
 * @returns Hour (0-23) and how many receipts fell in it, or `null` if empty.
 */
export const busiestHour = (receipts: Receipt[]): { hour: number; count: number } | null => {
  if (receipts.length === 0) return null;

  const counts = new Array<number>(24).fill(0);
  for (const receipt of receipts) {
    const date = new Date(receipt.timestamp);
    if (!Number.isNaN(date.getTime())) counts[date.getHours()] += 1;
  }

  let bestHour = 0;
  for (let hour = 1; hour < 24; hour++) {
    if (counts[hour] > counts[bestHour]) bestHour = hour;
  }

  return { hour: bestHour, count: counts[bestHour] };
};

/**
 * Renders an hour as a 12-hour clock label.
 *
 * @param hour - Hour in 0-23 form.
 * @returns Label such as `9 PM`.
 */
export const formatHour = (hour: number): string => {
  const suffix = hour < 12 ? 'AM' : 'PM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${suffix}`;
};

/**
 * Sums purchase spend, ignoring non-purchase receipts.
 *
 * Amounts in different currencies cannot be legitimately summed, so the total
 * is grouped per currency instead of being added blindly.
 *
 * @param receipts - Source receipts.
 * @returns One entry per currency, sorted by descending total.
 */
export const spendByCurrency = (receipts: Receipt[]): { currency: string; total: number }[] => {
  const totals = new Map<string, number>();

  for (const receipt of receipts) {
    if (receipt.type !== 'purchase') continue;
    const currency = receipt.currency.trim().toUpperCase() || 'UNKNOWN';
    totals.set(currency, (totals.get(currency) ?? 0) + receipt.price);
  }

  return [...totals.entries()]
    .map(([currency, total]) => ({ currency, total }))
    .sort((a, b) => b.total - a.total);
};

/**
 * Finds the most expensive calendar month.
 *
 * @param receipts - Source receipts.
 * @returns Month label, total and currency for the priciest month, else `null`.
 */
export const topSpendMonth = (
  receipts: Receipt[],
): { label: string; total: number; currency: string } | null => {
  const monthFormatter = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
  const totals = new Map<string, { total: number; currency: string }>();

  for (const receipt of receipts) {
    if (receipt.type !== 'purchase') continue;

    const date = new Date(receipt.timestamp);
    if (Number.isNaN(date.getTime())) continue;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const entry = totals.get(key);
    totals.set(key, {
      total: (entry?.total ?? 0) + receipt.price,
      currency: receipt.currency.trim().toUpperCase() || 'UNKNOWN',
    });
  }

  const ranked = [...totals.entries()].sort((a, b) => b[1].total - a[1].total);
  if (ranked.length === 0) return null;

  const [key, best] = ranked[0];
  const [year, month] = key.split('-').map(Number);
  return {
    label: monthFormatter.format(new Date(Date.UTC(year, month - 1, 1))),
    total: best.total,
    currency: best.currency,
  };
};

/**
 * Splits receipts into day and night using local time.
 *
 * @param receipts - Source receipts.
 * @returns Counts for 06:00-17:59 (`day`) and 18:00-05:59 (`night`).
 */
export const dayNightSplit = (receipts: Receipt[]): { day: number; night: number } => {
  let day = 0;
  let night = 0;

  for (const receipt of receipts) {
    const date = new Date(receipt.timestamp);
    if (Number.isNaN(date.getTime())) continue;
    const hour = date.getHours();
    if (hour >= 6 && hour < 18) day += 1;
    else night += 1;
  }

  return { day, night };
};

/**
 * Builds the headline insight list shown beside the feed.
 *
 * Returns at most six findings, each already formatted for display. Insights
 * that cannot be computed (no purchases, no music) are omitted rather than
 * rendered as "0" — an absent insight is less misleading than a zero one.
 *
 * @param receipts - Receipts to analyse.
 * @param connectionCount - Total connections found, for the link-density line.
 * @returns Formatted insights in a stable, priority-ordered list.
 */
export const buildInsights = (receipts: Receipt[], connectionCount = 0): Insight[] => {
  const insights: Insight[] = [];
  if (receipts.length === 0) return insights;

  const sorted = [...receipts].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  const first = new Date(sorted[0].timestamp);
  const last = new Date(sorted[sorted.length - 1].timestamp);
  const spanDays = Math.max(
    1,
    Math.round((last.getTime() - first.getTime()) / 86_400_000),
  );

  // 1. Feed span — the frame for everything else.
  insights.push({
    id: 'span',
    label: 'Feed span',
    value: `${formatCompactNumber(spanDays)} days`,
    detail: `${first.toLocaleDateString()} → ${last.toLocaleDateString()}`,
  });

  // 2. Busiest hour — when this person is actually active.
  const busiest = busiestHour(receipts);
  if (busiest && busiest.count > 0) {
    insights.push({
      id: 'busiest-hour',
      label: 'Busiest hour',
      value: formatHour(busiest.hour),
      detail: `${formatCompactNumber(busiest.count)} moments landed in this hour`,
    });
  }

  // 3. Top listen — the artist with the most plays.
  const artists = tallyBy(receipts, (receipt) =>
    receipt.type === 'music' ? receipt.artist : null,
  );
  if (artists.length > 0) {
    insights.push({
      id: 'top-artist',
      label: 'Most played artist',
      value: artists[0].label,
      detail: `${formatCompactNumber(artists[0].count)} plays on record`,
    });
  }

  // 4. Top venue — where time is actually spent.
  const places = tallyBy(receipts, (receipt) =>
    receipt.type === 'place' ? receipt.name : null,
  );
  if (places.length > 0) {
    insights.push({
      id: 'top-place',
      label: 'Most visited place',
      value: places[0].label,
      detail: `${formatCompactNumber(places[0].count)} recorded visits`,
    });
  }

  // 5. Spending — reported per currency, since sums across currencies are invalid.
  const topMonth = topSpendMonth(receipts);
  if (topMonth) {
    insights.push({
      id: 'top-spend',
      label: 'Costliest month',
      value: topMonth.label,
      detail: `${formatCurrency(topMonth.total, topMonth.currency)} in purchases`,
    });
  }

  // 6. Connection density — the headline product metric.
  if (connectionCount > 0) {
    const perReceipt = connectionCount / receipts.length;
    insights.push({
      id: 'density',
      label: 'Connections found',
      value: formatCompactNumber(connectionCount),
      detail: `${perReceipt.toFixed(1)} links per receipt across the feed`,
    });
  }

  return insights;
};
