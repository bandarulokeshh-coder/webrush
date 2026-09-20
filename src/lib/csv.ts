/**
 * CSV ingestion for the bundled datasets.
 *
 * The app ships `public/datasets/*.csv` as static assets and parses them
 * entirely in the browser, so no personal data ever leaves the machine. Each
 * parser is pure: `(csvText) => receipts`, which makes them directly unit
 * testable without a DOM or network.
 *
 * @module lib/csv
 */

import type {
  MusicReceipt,
  PlaceReceipt,
  PurchaseReceipt,
} from '../types/receipt';

/**
 * Splits CSV text into data rows.
 *
 * Handles both LF and CRLF line endings — the source files are generated on
 * different platforms, and leaving a trailing `\r` on the final field silently
 * corrupts currency and location strings.
 *
 * @param csvText - Raw CSV file contents.
 * @returns Data rows, header excluded.
 */
export const splitCsvRows = (csvText: string): string[] => {
  const lines = csvText.trim().split(/\r?\n/);
  return lines.length < 2 ? [] : lines.slice(1);
};

/**
 * Parses a single CSV line into fields, respecting quoted values.
 *
 * @param line - One CSV row.
 * @returns Field values with surrounding quotes removed.
 * @example
 * parseCsvLine('a,"Say It, Just Say It",b'); // ['a', 'Say It, Just Say It', 'b']
 */
export const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote inside a quoted field.
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
};

/** Strips a redundant pair of surrounding quotes from a field. */
const unquote = (value: string): string => value.replace(/^"(.*)"$/, '$1');

/**
 * Parses Spotify listening history into music receipts.
 *
 * Columns: `spotify_track_uri, ts, username, ms_played, track_name, artist_name,
 * album_name`. A play with zero milliseconds still becomes a receipt, falling
 * back to a nominal three-minute duration so durations stay meaningful.
 *
 * @param csvText - Raw Spotify export contents.
 * @returns One music receipt per play.
 */
export const parseSpotifyCsv = (csvText: string): MusicReceipt[] => {
  const receipts: MusicReceipt[] = [];

  splitCsvRows(csvText).forEach((row, index) => {
    if (!row.trim()) return;

    const values = parseCsvLine(row);
    if (values.length < 9) return;

    const [uri, ts, , msPlayedStr, trackName, artistName, albumName] = values;
    const msPlayed = Number.parseInt(msPlayedStr, 10);
    const duration = msPlayed > 0 ? Math.max(30, msPlayed / 1000) : 180;

    // The export URI repeats for every play of the same track, so the row
    // index is part of the id to guarantee unique, stable React keys.
    receipts.push({
      id: `${uri || 'spotify_row'}_${index}`,
      type: 'music',
      timestamp: ts,
      artist: unquote(artistName),
      track: unquote(trackName),
      album: unquote(albumName),
      duration,
    });
  });

  return receipts;
};

/**
 * Parses daily household transactions into purchase receipts.
 *
 * Only rows marked `expense` with a positive amount become receipts; the
 * `Mode` column is surfaced as the merchant because the dataset has no explicit
 * merchant field.
 *
 * @param csvText - Raw household transaction CSV.
 * @returns One purchase receipt per expense.
 */
export const parseTransactionsCsv = (csvText: string): PurchaseReceipt[] => {
  const receipts: PurchaseReceipt[] = [];

  splitCsvRows(csvText).forEach((row, index) => {
    if (!row.trim()) return;

    const values = parseCsvLine(row);
    if (values.length < 8) return;

    const [date, mode, category, , note, amountStr, incomeExpense, currency] = values;
    if (incomeExpense.trim().toLowerCase() !== 'expense') return;

    const amount = Number.parseFloat(amountStr);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const timestamp = toIsoFromDayFirst(date);
    if (!timestamp) return;

    receipts.push({
      id: `txn_${index}`,
      type: 'purchase',
      timestamp,
      item: note.trim() || 'Purchase',
      category: category.trim(),
      price: amount,
      currency: currency.trim(),
      merchant: mode.trim(),
    });
  });

  return receipts;
};

/**
 * Parses India Transact card activity into purchases and the places visited.
 *
 * Each qualifying row yields a purchase, and — when merchant coordinates are
 * present — contributes to a de-duplicated set of places keyed by
 * `city|state|latitude|longitude`, so a merchant visited fifty times still
 * produces exactly one place receipt.
 *
 * @param csvText - Raw India Transact CSV.
 * @returns Purchases plus the unique places derived from merchant locations.
 */
export const parseIndiaTransactCsv = (
  csvText: string,
): { purchases: PurchaseReceipt[]; places: PlaceReceipt[] } => {
  const purchases: PurchaseReceipt[] = [];
  const places: PlaceReceipt[] = [];
  const seenPlaces = new Map<string, PlaceReceipt>();

  splitCsvRows(csvText).forEach((row, index) => {
    if (!row.trim()) return;

    const values = parseCsvLine(row);
    if (values.length < 15) return;

    const [
      transId,
      transDateTransTime,
      ,
      merchant,
      category,
      amountStr,
      first,
      last,
      ,
      street,
      city,
      state,
      ,
      ,
      ,
      ,
      ,
      ,
      merchLatStr,
      merchLongStr,
    ] = values;

    const amount = Number.parseFloat(amountStr);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const timestamp = toIsoFromMonthFirst(transDateTransTime);
    if (!timestamp) return;

    purchases.push({
      id: `trans_${transId || index}`,
      type: 'purchase',
      timestamp,
      item: merchant || 'Purchase',
      category: category || 'Unknown',
      price: amount,
      currency: 'USD',
      merchant: `${first} ${last}`.trim() || 'Unknown Merchant',
    });

    const latitude = Number.parseFloat(merchLatStr);
    const longitude = Number.parseFloat(merchLongStr);
    const cityName = city?.trim();
    const stateName = state?.trim();

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !cityName ||
      !stateName
    ) {
      return;
    }

    const placeKey = `${cityName}|${stateName}|${latitude}|${longitude}`;
    if (seenPlaces.has(placeKey)) return;

    const place: PlaceReceipt = {
      id: `place_${seenPlaces.size}`,
      type: 'place',
      timestamp,
      name: merchant || `${cityName}, ${stateName}`,
      category: category || 'merchant',
      latitude,
      longitude,
      address: `${street || ''}, ${cityName}, ${stateName}`.trim(),
    };

    places.push(place);
    seenPlaces.set(placeKey, place);
  });

  return { purchases, places };
};

/**
 * Converts `DD/MM/YYYY HH:MM:SS` into an ISO-8601 string.
 *
 * @param value - Day-first date-time field.
 * @returns ISO string, or `null` when the field is malformed.
 */
export const toIsoFromDayFirst = (value: string): string | null => {
  const [datePart, timePart] = value.trim().split(' ');
  if (!datePart || !timePart) return null;

  const [day, month, year] = datePart.split('/');
  if (!day || !month || !year) return null;

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}:00.000Z`;
};

/**
 * Converts `MM/DD/YYYY H:MM` into an ISO-8601 string.
 *
 * @param value - Month-first date-time field.
 * @returns ISO string, or `null` when the field is malformed.
 */
export const toIsoFromMonthFirst = (value: string): string | null => {
  const [datePart, timePart] = value.trim().split(' ');
  if (!datePart || !timePart) return null;

  const [month, day, year] = datePart.split('/');
  if (!month || !day || !year) return null;

  const [hours, minutes] = timePart.split(':');
  if (hours === undefined || minutes === undefined) return null;

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00.000Z`;
};

/**
 * Generic CSV row mapper for simple, single-shape datasets.
 *
 * @param csvText - Raw CSV contents.
 * @param mapper - Converts a field array into a value, or `null` to skip.
 * @returns Successfully mapped values.
 */
export const parseCsv = <T>(
  csvText: string,
  mapper: (fields: string[], index: number) => T | null,
): T[] => {
  const results: T[] = [];

  splitCsvRows(csvText).forEach((row, index) => {
    const line = row.trim();
    if (!line) return;

    const mapped = mapper(parseCsvLine(line), index);
    if (mapped !== null) results.push(mapped);
  });

  return results;
};
