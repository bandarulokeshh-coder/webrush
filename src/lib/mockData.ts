/**
 * Synthetic demo dataset.
 *
 * Two design choices matter here:
 *
 * 1. **Seeded randomness.** A `mulberry32` PRNG replaces `Math.random()` so the
 *    demo dataset is identical on every reload and in every test run. Without
 *    this, snapshot tests and connection counts are unreproducible.
 * 2. **Deliberate cross-references.** Photos tag the same people who appear in
 *    messages, and notes mention the artists in the music set. This means the
 *    social and artist detectors produce real output on demo data, so a visitor
 *    sees the interesting results immediately rather than an empty panel.
 *
 * @module lib/mockData
 */

import type { Receipt } from '../types/receipt';

/** Names used consistently across photos, messages and notes. */
const PEOPLE = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Casey'] as const;

/** Artists used by both music receipts and note mentions. */
const ARTISTS = ['The Weeknd', 'Taylor Swift', 'Drake', 'Billie Eilish', 'Ed Sheeran'] as const;

/** Venues used by place receipts, photos and events alike. */
const VENUES = [
  { name: 'Central Park', category: 'park' },
  { name: 'Starbucks Downtown', category: 'cafe' },
  { name: 'Metropolitan Museum', category: 'museum' },
  { name: 'Grand Central Terminal', category: 'transit' },
  { name: 'Brooklyn Bridge', category: 'landmark' },
] as const;

/** Inclusive-start, exclusive-end date range for generated timestamps. */
const RANGE_START = Date.UTC(2024, 0, 1);
const RANGE_END = Date.UTC(2024, 11, 31);

/**
 * Creates a deterministic pseudo-random number generator.
 *
 * mulberry32 is a compact, well-distributed 32-bit PRNG — ideal here because it
 * needs no dependencies and produces a stable sequence from a fixed seed.
 *
 * @param seed - Any 32-bit integer.
 * @returns Function yielding floats in `[0, 1)`.
 */
export const createRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Builds the synthetic receipt feed.
 *
 * Produces 130 receipts spanning 2024 across all nine receipt types, with the
 * cross-references described in the module docstring.
 *
 * @param seed - PRNG seed; pass a different value for a fresh but stable set.
 * @returns Receipts in generation order (the UI sorts as needed).
 */
export const generateMockData = (seed = 20240101): Receipt[] => {
  const random = createRandom(seed);
  const receipts: Receipt[] = [];

  /** Random ISO timestamp inside the configured range. */
  const randomTimestamp = (): string =>
    new Date(RANGE_START + random() * (RANGE_END - RANGE_START)).toISOString();

  /** Picks a random element from a readonly tuple or array. */
  const pick = <T,>(items: readonly T[]): T => items[Math.floor(random() * items.length)];

  const tracks = ['Blinding Lights', 'Anti-Hero', "God's Plan", 'Bad Guy', 'Shape of You'] as const;

  // Music — each play is tied to an artist that also appears in the notes below.
  for (let i = 0; i < 15; i++) {
    const artist = ARTISTS[i % ARTISTS.length];
    receipts.push({
      id: `music_${i}`,
      type: 'music',
      timestamp: randomTimestamp(),
      artist,
      track: tracks[i % tracks.length],
      album: `${artist} Essentials`,
      duration: 180 + Math.round(random() * 120),
    });
  }

  const movies = [
    { title: 'Inception', genre: ['Sci-Fi', 'Thriller'] },
    { title: 'Parasite', genre: ['Thriller', 'Drama'] },
    { title: 'Everything Everywhere All at Once', genre: ['Sci-Fi', 'Comedy', 'Drama'] },
    { title: 'Top Gun: Maverick', genre: ['Action', 'Drama'] },
    { title: 'Spider-Man: Across the Spider-Verse', genre: ['Animation', 'Action'] },
  ] as const;

  // Movies.
  for (let i = 0; i < 10; i++) {
    const movie = movies[i % movies.length];
    receipts.push({
      id: `movie_${i}`,
      type: 'movie',
      timestamp: randomTimestamp(),
      title: movie.title,
      genre: [...movie.genre],
      rating: Math.round((6 + random() * 4) * 10) / 10,
      platform: pick(['Netflix', 'Disney+', 'HBO Max', 'Amazon Prime', 'Theater'] as const),
    });
  }

  // Places — coordinates jitter around New York City.
  for (let i = 0; i < 12; i++) {
    const venue = VENUES[i % VENUES.length];
    receipts.push({
      id: `place_${i}`,
      type: 'place',
      timestamp: randomTimestamp(),
      name: venue.name,
      category: venue.category,
      latitude: Number((40.7 + random() * 0.1).toFixed(4)),
      longitude: Number((-74.0 + random() * 0.1).toFixed(4)),
      address: `${venue.name}, New York, NY`,
    });
  }

  const purchases = [
    { item: 'Wireless Headphones', category: 'electronics', price: 199 },
    { item: 'Coffee Maker', category: 'appliances', price: 89 },
    { item: 'Novel', category: 'books', price: 15 },
    { item: 'Sneakers', category: 'clothing', price: 120 },
    { item: 'Groceries', category: 'food', price: 75 },
  ] as const;

  // Purchases.
  for (let i = 0; i < 20; i++) {
    const purchase = purchases[i % purchases.length];
    receipts.push({
      id: `purchase_${i}`,
      type: 'purchase',
      timestamp: randomTimestamp(),
      item: purchase.item,
      category: purchase.category,
      price: purchase.price,
      currency: 'USD',
      merchant: pick(['Amazon', 'Walmart', 'Target', 'Best Buy', 'Local Store'] as const),
    });
  }

  // Photos — the venue name and tagged people are chosen from the same pools
  // used by places and messages, which is what makes the location and social
  // detectors find something on demo data.
  for (let i = 0; i < 18; i++) {
    const venue = VENUES[i % VENUES.length];
    receipts.push({
      id: `photo_${i}`,
      type: 'photo',
      timestamp: randomTimestamp(),
      caption: pick(['Weekend brunch', 'City skyline', 'Friends gathering', 'Nature hike', 'Concert'] as const),
      location: venue.name,
      people: [PEOPLE[i % PEOPLE.length], PEOPLE[(i + 1) % PEOPLE.length]],
    });
  }

  // Messages — the body mentions a tagged person so photo/message pairs link.
  for (let i = 0; i < 25; i++) {
    const person = PEOPLE[i % PEOPLE.length];
    receipts.push({
      id: `message_${i}`,
      type: 'message',
      timestamp: randomTimestamp(),
      sender: person,
      recipient: 'You',
      content: `Hey, ${PEOPLE[(i + 1) % PEOPLE.length]} and I were just talking about that — what did you think?`,
      isRead: random() > 0.3,
    });
  }

  const queries = [
    'best restaurants nyc',
    'how to fix leaky faucet',
    'upcoming concerts',
    'weather forecast',
    'python tutorial',
  ] as const;

  // Searches.
  for (let i = 0; i < 12; i++) {
    receipts.push({
      id: `search_${i}`,
      type: 'search',
      timestamp: randomTimestamp(),
      query: queries[i % queries.length],
      resultsCount: Math.floor(random() * 1_000_000),
      clickedResult: random() > 0.5 ? 'Example result' : undefined,
    });
  }

  const events = [
    { title: 'Jazz Concert in the Park', description: 'Live jazz performance' },
    { title: 'Tech Meetup', description: 'Monthly developer gathering' },
    { title: 'Art Exhibition Opening', description: 'Contemporary art showcase' },
    { title: 'Food Festival', description: 'International cuisine celebration' },
    { title: 'Outdoor Movie Night', description: 'Classic films under the stars' },
  ] as const;

  // Events — locations and attendees overlap with photos and messages.
  for (let i = 0; i < 8; i++) {
    const event = events[i % events.length];
    receipts.push({
      id: `event_${i}`,
      type: 'event',
      timestamp: randomTimestamp(),
      endTime: new Date(RANGE_START + random() * (RANGE_END - RANGE_START)).toISOString(),
      title: event.title,
      description: event.description,
      location: VENUES[i % VENUES.length].name,
      attendees: [PEOPLE[i % PEOPLE.length], PEOPLE[(i + 2) % PEOPLE.length]],
    });
  }

  // Notes — each mentions an artist, which the artist detector matches against
  // the music receipts generated above.
  for (let i = 0; i < 10; i++) {
    const artist = ARTISTS[i % ARTISTS.length];
    receipts.push({
      id: `note_${i}`,
      type: 'note',
      timestamp: randomTimestamp(),
      content: `Can't stop listening to ${artist} lately — added three tracks to the commute playlist.`,
      tags: pick([['idea'], ['reminder'], ['music'], ['playlist'], ['read-later']] as const),
    });
  }

  return receipts;
};
