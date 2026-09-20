/**
 * Unit tests for the connection detectors over synthetic receipts.
 */
import { describe, expect, it } from 'vitest';
import type { MusicReceipt, NoteReceipt, PhotoReceipt, PlaceReceipt, Receipt } from '../types/receipt';
import {
  countConnections,
  filterByDateRange,
  findActivityChains,
  findAllConnections,
  findArtistConnections,
  findLocationConnections,
  findSocialConnections,
  findTemporalConnections,
  sortByTimestamp,
} from './connections';

const photo = (id: string, timestamp: string): PhotoReceipt => ({
  id,
  type: 'photo',
  timestamp,
  caption: 'Weekend brunch',
  location: 'Central Park',
  people: ['Alex', 'Sam'],
});

const place = (id: string, timestamp: string): PlaceReceipt => ({
  id,
  type: 'place',
  timestamp,
  name: 'Central Park',
  category: 'park',
});

const music = (id: string, timestamp: string): MusicReceipt => ({
  id,
  type: 'music',
  timestamp,
  artist: 'Taylor Swift',
  track: 'Anti-Hero',
});

const note = (id: string, timestamp: string, content: string): NoteReceipt => ({
  id,
  type: 'note',
  timestamp,
  content,
});

describe('sortByTimestamp / filterByDateRange', () => {
  it('orders oldest first without mutating', () => {
    const receipts: Receipt[] = [photo('b', '2024-02-01T00:00:00Z'), photo('a', '2024-01-01T00:00:00Z')];
    expect(sortByTimestamp(receipts).map((r) => r.id)).toEqual(['a', 'b']);
    expect(receipts[0].id).toBe('b');
  });

  it('filters inclusively', () => {
    const receipts: Receipt[] = [photo('a', '2024-01-01T00:00:00Z'), photo('b', '2024-06-01T00:00:00Z')];
    expect(filterByDateRange(receipts, '2024-01-01', '2024-03-01')).toHaveLength(1);
  });
});

describe('findTemporalConnections', () => {
  it('links receipts inside the window', () => {
    const receipts: Receipt[] = [
      photo('a', '2024-01-01T10:00:00Z'),
      photo('b', '2024-01-01T10:30:00Z'),
      photo('c', '2024-01-02T10:00:00Z'),
    ];
    const connections = findTemporalConnections(receipts, 60 * 60 * 1000);
    expect(connections.map((c) => [c.receipt1.id, c.receipt2.id])).toEqual([['a', 'b']]);
  });
});

describe('findLocationConnections', () => {
  it('matches photos to places by venue name', () => {
    const connections = findLocationConnections([
      place('place-1', '2024-01-01T10:00:00Z'),
      photo('photo-1', '2024-01-01T11:00:00Z'),
    ]);
    expect(connections).toHaveLength(1);
    expect(connections[0].place.id).toBe('place-1');
  });
});

describe('findArtistConnections', () => {
  it('matches notes that mention the artist', () => {
    const connections = findArtistConnections([
      music('m-1', '2024-01-01T10:00:00Z'),
      note('n-1', '2024-01-01T11:00:00Z', 'Cannot stop listening to Taylor Swift lately'),
      note('n-2', '2024-01-01T11:00:00Z', 'grocery list: milk and eggs'),
    ]);
    expect(connections).toHaveLength(1);
    expect(connections[0].artist).toBe('Taylor Swift');
  });
});

describe('findSocialConnections', () => {
  it('returns empty when nothing is shared', () => {
    expect(findSocialConnections([photo('a', '2024-01-01T00:00:00Z')])).toEqual([]);
  });
});

describe('findActivityChains', () => {
  it('groups consecutive moments into one chain', () => {
    const receipts: Receipt[] = [
      photo('a', '2024-01-01T10:00:00Z'),
      photo('b', '2024-01-01T11:00:00Z'),
      photo('c', '2024-01-02T10:00:00Z'),
    ];
    const chains = findActivityChains(receipts);
    expect(chains).toHaveLength(1);
    expect(chains[0].receipts.map((r) => r.id)).toEqual(['a', 'b']);
  });
});

describe('findAllConnections', () => {
  it('honours the temporal toggle', () => {
    const receipts: Receipt[] = [
      photo('a', '2024-01-01T10:00:00Z'),
      photo('b', '2024-01-01T10:10:00Z'),
    ];
    const on = findAllConnections(receipts, { includeTemporal: true });
    const off = findAllConnections(receipts, { includeTemporal: false });
    expect(on.some((g) => g.type === 'temporal')).toBe(true);
    expect(off.some((g) => g.type === 'temporal')).toBe(false);
  });

  it('counts across groups', () => {
    const receipts: Receipt[] = [
      photo('a', '2024-01-01T10:00:00Z'),
      photo('b', '2024-01-01T10:10:00Z'),
      place('p-1', '2024-01-01T10:05:00Z'),
    ];
    expect(countConnections(findAllConnections(receipts))).toBeGreaterThan(0);
  });
});
