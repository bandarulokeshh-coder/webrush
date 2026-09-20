// Utility to load and parse real datasets into our Receipt types

import {
  MusicReceipt,
  PurchaseReceipt,
  PlaceReceipt,
  PhotoReceipt,
  MessageReceipt,
  SearchReceipt,
  EventReceipt,
  NoteReceipt,
  Receipt
} from './data';

// Parse Spotify data into MusicReceipts
export const loadSpotifyData = (csvText: string): MusicReceipt[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Skip header
  const dataLines = lines.slice(1);
  const musicReceipts: MusicReceipt[] = [];

  for (const line of dataLines) {
    try {
      // Parse CSV line (simple split, assuming no commas in quoted fields)
      const values = line.split(',');
      if (values.length < 9) continue;

      const [spotifyTrackUri, ts, platform, msPlayedStr, trackName, artistName, albumName, reasonStart, reasonEnd, shuffleStr, skippedStr] = values;

      const msPlayed = parseInt(msPlayedStr, 10);
      const duration = msPlayed > 0 ? Math.max(30, msPlayed / 1000) : 180; // Default to 3min if not played

      // Clean up quotes if present
      const cleanTrackName = trackName.replace(/^"(.*)"$/, '$1');
      const cleanArtistName = artistName.replace(/^"(.*)"$/, '$1');
      const cleanAlbumName = albumName.replace(/^"(.*)"$/, '$1');

      musicReceipts.push({
        id: spotifyTrackUri || `spotify_${Date.now()}_${Math.random()}`,
        type: 'music',
        timestamp: ts, // Already in ISO-like format: "2013-07-08 02:44:34"
        artist: cleanArtistName,
        track: cleanTrackName,
        duration: duration // in seconds
      });
    } catch (error) {
      console.warn('Failed to parse Spotify line:', line, error);
      continue;
    }
  }

  return musicReceipts;
};

// Parse transaction data (from Daily Household Transactions.csv) into PurchaseReceipts
export const loadTransactionData = (csvText: string): PurchaseReceipt[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Skip header
  const dataLines = lines.slice(1);
  const purchaseReceipts: PurchaseReceipt[] = [];

  for (const line of dataLines) {
    try {
      // Parse CSV line
      const values = line.split(',');
      if (values.length < 8) continue;

      const [date, mode, category, subcategory, note, amountStr, incomeExpense, currency] = values;

      // Only consider expenses for purchase receipts
      if (incomeExpense.trim().toLowerCase() !== 'expense') continue;

      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) continue;

      // Parse date (format: "20/09/2018 12:04:08")
      const dateParts = date.split(' ');
      if (dateParts.length < 2) continue;

      const datePart = dateParts[0]; // "20/09/2018"
      const timePart = dateParts[1]; // "12:04:08"

      const [day, month, year] = datePart.split('/');
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}:00.000Z`;

      purchaseReceipts.push({
        id: `txn_${Date.now()}_${Math.random()}`,
        type: 'purchase',
        timestamp: isoDate,
        item: note.trim() || 'Purchase',
        category: category.trim(),
        price: amount,
        currency: currency.trim(),
        merchant: mode.trim() // Using mode as merchant placeholder
      });
    } catch (error) {
      console.warn('Failed to parse transaction line:', line, error);
      continue;
    }
  }

  return purchaseReceipts;
};

// Parse India Transact data into PurchaseReceipts and PlaceReceipts
export const loadIndiaTransactData = (csvText: string): {
  purchases: PurchaseReceipt[];
  places: PlaceReceipt[]
} => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return { purchases: [], places: [] };

  // Skip header
  const dataLines = lines.slice(1);
  const purchases: PurchaseReceipt[] = [];
  const places: PlaceReceipt[] = [];
  const placeMap = new Map<string, PlaceReceipt>(); // To avoid duplicate places

  for (const line of dataLines) {
    try {
      // Parse CSV line
      const values = line.split(',');
      if (values.length < 15) continue;

      const [transIdStr, transDateTransTime, ccNumStr, merchant, category, amtStr, first, last, gender, street, city, state, latStr, longStr, cityPopStr, job, dob, merchLatStr, merchLongStr, isFraudStr, customerIdStr] = values;

      const amount = parseFloat(amtStr);
      if (isNaN(amount) || amount <= 0) continue;

      // Parse timestamp (format: "12/26/2023 0:55")
      const [datePart, timePart] = transDateTransTime.split(' ');
      if (!datePart || !timePart) continue;

      const [month, day, year] = datePart.split('/');
      const [hours, minutes] = timePart.split(':');
      const seconds = '00'; // Assume 00 seconds if not provided
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds}.000Z`;

      // Create purchase receipt
      purchases.push({
        id: `trans_${transIdStr}`,
        type: 'purchase',
        timestamp: isoDate,
        item: merchant || 'Purchase',
        category: category || 'Unknown',
        price: amount,
        currency: 'USD', // Assuming USD, could be inferred from context
        merchant: `${first} ${last}`.trim() || 'Unknown Merchant'
      });

      // Create place receipt if we have location data
      const merchLat = parseFloat(merchLatStr);
      const merchLong = parseFloat(merchLongStr);
      const cityName = city?.trim();
      const stateName = state?.trim();

      if (!isNaN(merchLat) && !isNaN(merchLong) && cityName && stateName) {
        const placeKey = `${cityName}|${stateName}|${merchLat}|${merchLong}`;

        if (!placeMap.has(placeKey)) {
          const place: PlaceReceipt = {
            id: `place_${Date.now()}_${Math.random()}`,
            type: 'place',
            timestamp: isoDate, // Using transaction time as place visit time
            name: merchant || `${cityName}, ${stateName}`,
            category: category || 'merchant',
            latitude: merchLat,
            longitude: merchLong,
            address: `${street || ''}, ${cityName}, ${stateName}`.trim()
          };

          places.push(place);
          placeMap.set(placeKey, place);
        }
      }
    } catch (error) {
      console.warn('Failed to parse India Transact line:', line, error);
      continue;
    }
  }

  return { purchases, places };
};

// Generic CSV loader that can be extended for other formats
export const loadCSVData = <T>(csvText: string, parser: (line: string, index: number) => T | null): T[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const dataLines = lines.slice(1);
  const results: T[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    if (!line) continue;

    try {
      const parsed = parser(line, i);
      if (parsed !== null) {
        results.push(parsed);
      }
    } catch (error) {
      console.warn(`Failed to parse line ${i + 2}:`, line, error);
      continue;
    }
  }

  return results;
};

// Helper to fetch and load dataset (for use in browser)
export const fetchAndLoadDataset = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch dataset: ${response.statusText}`);
  }
  return response.text();
};

export default {
  loadSpotifyData,
  loadTransactionData,
  loadIndiaTransactData,
  loadCSVData,
  fetchAndLoadDataset
};