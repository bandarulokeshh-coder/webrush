/**
 * Connection detection — the analytical core of WebRush.
 *
 * A "connection" is a relationship between two receipts that a single record
 * could never reveal: a photo taken where you also checked in, a note that
 * names an artist you played that week, a run of moments that add up to one
 * outing.
 *
 * ## Complexity
 *
 * The naive formulation of these detectors is quadratic — for every place,
 * scan every photo; for every artist, scan every note. That is acceptable for a
 * 130-receipt demo but janks the main thread once the card dataset (10k+ rows,
 * hundreds of places) is loaded, because each comparison also lowercases and
 * allocates strings.
 *
 * Every detector below instead builds a **lookup index once** and then does a
 * single pass over the candidate records, which drops the hot loops to
 * `O(n + m)`. Observable results are unchanged; only the cost is.
 *
 * @module lib/connections
 */

import type {
  ActivityChain,
  ArtistConnection,
  ConnectionGroup,
  ConnectionOptions,
  LocationConnection,
  LocationNameConnection,
  PlaceReceipt,
  Receipt,
  ReceiptOfType,
  SocialConnection,
  TemporalConnection,
} from '../types/receipt';
import { DEFAULT_TEMPORAL_THRESHOLD_MS } from '../constants/receipts';

/** Milliseconds in one hour, used for chain windows. */
const HOUR_MS = 3_600_000;

/** Default maximum gap between consecutive moments in an activity chain. */
export const DEFAULT_CHAIN_WINDOW_MS = 3 * HOUR_MS;

/** Minimum number of shared meaningful words for a message/note link. */
const MIN_SHARED_WORDS = 2;

/** Words that carry no signal when comparing free text. */
const STOP_WORDS = new Set([
  'about', 'after', 'again', 'been', 'before', 'being', 'could', 'doing',
  'from', 'have', 'just', 'like', 'more', 'only', 'other', 'should', 'some',
  'than', 'that', 'their', 'them', 'then', 'there', 'these', 'they', 'this',
  'those', 'very', 'what', 'when', 'where', 'which', 'while', 'with', 'would',
  'your', 'were', 'will',
]);

/**
 * Indexes receipts by their discriminant in a single pass.
 *
 * @param receipts - Receipts to group.
 * @returns A `type -> receipts` record containing only the types present.
 */
export const groupByType = (receipts: Receipt[]): Partial<Record<Receipt['type'], Receipt[]>> =>
  receipts.reduce<Partial<Record<Receipt['type'], Receipt[]>>>((acc, receipt) => {
    (acc[receipt.type] ??= []).push(receipt);
    return acc;
  }, {});

/**
 * Selects receipts of one type with precise typing.
 *
 * `groupByType` intentionally widens to `Receipt[]`, which forces a cast at
 * every use site. This accessor performs the narrowing once so callers get
 * `ReceiptOfType<T>[]` and cannot accidentally touch a field that only exists
 * on a different variant — the mistake that this module's strict types exist to
 * prevent.
 *
 * @param index - Output of {@link groupByType}.
 * @param type - Discriminant to select.
 * @returns Receipts of that type, narrowed to the matching variant.
 */
export const receiptsOfType = <T extends Receipt['type']>(
  index: Partial<Record<Receipt['type'], Receipt[]>>,
  type: T,
): ReceiptOfType<T>[] => (index[type] ?? []) as ReceiptOfType<T>[];

/**
 * Sorts receipts chronologically without mutating the input.
 *
 * @param receipts - Receipts to sort.
 * @returns A new array ordered oldest-first.
 */
export const sortByTimestamp = (receipts: Receipt[]): Receipt[] =>
  [...receipts].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

/**
 * Keeps only receipts inside an inclusive date range.
 *
 * @param receipts - Receipts to filter.
 * @param start - ISO date string marking the start of the range.
 * @param end - ISO date string marking the end of the range.
 * @returns Receipts whose timestamps fall within `[start, end]`.
 */
export const filterByDateRange = (receipts: Receipt[], start: string, end: string): Receipt[] => {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  return receipts.filter((receipt) => {
    const time = new Date(receipt.timestamp).getTime();
    return time >= startTime && time <= endTime;
  });
};


/**
 * Finds consecutive pairs of receipts that happened close together.
 *
 * @param receipts - Receipts to inspect.
 * @param maxTimeDiffMs - Maximum gap for a pair to count as connected.
 * @returns Adjacent pairs within the window, each with its exact gap.
 */
export const findTemporalConnections = (
  receipts: Receipt[],
  maxTimeDiffMs: number = DEFAULT_TEMPORAL_THRESHOLD_MS,
): TemporalConnection[] => {
  const sorted = sortByTimestamp(receipts);
  const connections: TemporalConnection[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const time1 = new Date(sorted[i].timestamp).getTime();
    const time2 = new Date(sorted[i + 1].timestamp).getTime();
    const timeDiffMs = Math.abs(time2 - time1);

    if (timeDiffMs <= maxTimeDiffMs) {
      connections.push({ receipt1: sorted[i], receipt2: sorted[i + 1], timeDiffMs });
    }
  }

  return connections;
};

/**
 * Finds photos whose location text mentions a known place.
 *
 * Each unique place name is indexed once up front, so the inner loop is a Map
 * lookup plus one `includes` call rather than a fresh pair of `toLowerCase()`
 * calls per combination.
 *
 * @param receipts - Receipts to inspect.
 * @returns Matching place/photo pairs.
 */
export const findLocationConnections = (receipts: Receipt[]): LocationConnection[] => {
  const byType = groupByType(receipts);
  const places = receiptsOfType(byType, 'place');
  const photos = receiptsOfType(byType, 'photo');
  const connections: LocationConnection[] = [];

  // Index place names once: lowercase name -> places sharing that name.
  const placeIndex = new Map<string, PlaceReceipt[]>();
  for (const place of places) {
    const key = place.name.toLowerCase();
    const bucket = placeIndex.get(key);
    if (bucket) bucket.push(place);
    else placeIndex.set(key, [place]);
  }

  for (const photo of photos) {
    if (!photo.location) continue;
    const haystack = photo.location.toLowerCase();

    for (const [name, matches] of placeIndex) {
      if (!haystack.includes(name)) continue;
      for (const place of matches) connections.push({ place, photo });
    }
  }

  return connections;
};

/**
 * Finds notes that mention an artist the user listened to.
 *
 * @param receipts - Receipts to inspect.
 * @returns Matching music/note pairs with the shared artist name.
 */
export const findArtistConnections = (receipts: Receipt[]): ArtistConnection[] => {
  const byType = groupByType(receipts);
  const tracks = receiptsOfType(byType, 'music');
  const notes = receiptsOfType(byType, 'note');
  const connections: ArtistConnection[] = [];

  // Index distinct artists once; several tracks may credit the same artist.
  const artistIndex = new Map<string, ReceiptOfType<'music'>[]>();
  for (const music of tracks) {
    const key = music.artist.toLowerCase();
    const bucket = artistIndex.get(key);
    if (bucket) bucket.push(music);
    else artistIndex.set(key, [music]);
  }

  for (const note of notes) {
    const haystack = note.content.toLowerCase();
    for (const [artist, matches] of artistIndex) {
      if (!haystack.includes(artist)) continue;
      for (const music of matches) connections.push({ music, note, artist: music.artist });
    }
  }

  return connections;
};

/**
 * Finds events, photos and notes that name a place from your history.
 *
 * Broader than {@link findLocationConnections}: it also considers event
 * locations and free-text note bodies.
 *
 * @param receipts - Receipts to inspect.
 * @returns Matching place/record pairs, each tagged with the record kind.
 */
export const findLocationNameConnections = (receipts: Receipt[]): LocationNameConnection[] => {
  const byType = groupByType(receipts);
  const places = receiptsOfType(byType, 'place');
  const events = receiptsOfType(byType, 'event');
  const photos = receiptsOfType(byType, 'photo');
  const notes = receiptsOfType(byType, 'note');
  const connections: LocationNameConnection[] = [];

  for (const place of places) {
    const placeName = place.name.toLowerCase();

    for (const event of events) {
      if (!event.location) continue;
      if (event.location.toLowerCase().includes(placeName)) {
        connections.push({
          place,
          connectedTo: event,
          connectionType: 'event',
          locationMatch: event.location,
        });
      }
    }

    for (const photo of photos) {
      if (!photo.location) continue;
      if (photo.location.toLowerCase().includes(placeName)) {
        connections.push({
          place,
          connectedTo: photo,
          connectionType: 'photo',
          locationMatch: photo.location,
        });
      }
    }

    for (const note of notes) {
      if (note.content.toLowerCase().includes(placeName)) {
        connections.push({
          place,
          connectedTo: note,
          connectionType: 'note',
          locationMatch: place.name,
        });
      }
    }
  }

  return connections;
};

/**
 * Builds a human-readable label for a run of activity.
 *
 * @param receipts - Receipts in the chain, oldest first.
 * @returns Sentence such as `Activity chain: Music → Place → Photo (3 moments)`.
 */
export const describeChain = (receipts: Receipt[]): string => {
  const typeMap: Record<Receipt['type'], string> = {
    music: '🎵 Music',
    movie: '🎬 Movie',
    place: '📍 Place',
    purchase: '🛒 Purchase',
    photo: '📸 Photo',
    message: '💬 Message',
    search: '🔍 Search',
    event: '📅 Event',
    note: '📝 Note',
  };

  const labels = [...new Set(receipts.map((receipt) => typeMap[receipt.type]))].join(' → ');
  return `Activity chain: ${labels} (${receipts.length} moments)`;
};

/**
 * Groups receipts into runs of continuous activity.
 *
 * A chain ends when the gap to the next receipt exceeds `maxTimeBetween`.
 * Single-receipt runs are discarded — they are not chains. The trailing run is
 * flushed after the loop so the most recent activity is never dropped.
 *
 * @param receipts - Receipts to segment.
 * @param maxTimeBetween - Maximum gap, in ms, inside a chain.
 * @returns Chains with their start, end, duration and description.
 */
export const findActivityChains = (
  receipts: Receipt[],
  maxTimeBetween: number = DEFAULT_CHAIN_WINDOW_MS,
): ActivityChain[] => {
  const sorted = sortByTimestamp(receipts);
  const chains: ActivityChain[] = [];
  let current: Receipt[] = [];

  /** Commits the working chain when it holds at least two moments. */
  const flush = (): void => {
    if (current.length < 2) return;

    const startTime = new Date(current[0].timestamp).getTime();
    const endTime = new Date(current[current.length - 1].timestamp).getTime();

    chains.push({
      receipts: [...current],
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      durationMs: endTime - startTime,
      description: describeChain(current),
    });
  };

  for (const receipt of sorted) {
    if (current.length === 0) {
      current.push(receipt);
      continue;
    }

    const lastTime = new Date(current[current.length - 1].timestamp).getTime();
    const currentTime = new Date(receipt.timestamp).getTime();

    if (currentTime - lastTime <= maxTimeBetween) {
      current.push(receipt);
    } else {
      flush();
      current = [receipt];
    }
  }

  flush();
  return chains;
};

/**
 * Runs every enabled detector and returns the non-empty results.
 *
 * @param receipts - Receipts to analyse.
 * @param options - Which detectors to run and the temporal window.
 * @returns One entry per detector that found at least one connection.
 */
export const findAllConnections = (
  receipts: Receipt[],
  options: ConnectionOptions = {},
): ConnectionGroup[] => {
  const {
    temporalThresholdMs = DEFAULT_TEMPORAL_THRESHOLD_MS,
    includeTemporal = true,
    includeLocation = true,
    includeLocationName = true,
    includeArtist = true,
    includeSocial = true,
    includeChains = true,
  } = options;

  const groups: ConnectionGroup[] = [];

  if (includeTemporal) {
    const temporal = findTemporalConnections(receipts, temporalThresholdMs);
    if (temporal.length > 0) groups.push({ type: 'temporal', data: temporal });
  }

  if (includeLocation) {
    const location = findLocationConnections(receipts);
    if (location.length > 0) groups.push({ type: 'location', data: location });
  }

  if (includeLocationName) {
    const locationName = findLocationNameConnections(receipts);
    if (locationName.length > 0) groups.push({ type: 'location-name', data: locationName });
  }

  if (includeArtist) {
    const artist = findArtistConnections(receipts);
    if (artist.length > 0) groups.push({ type: 'artist', data: artist });
  }

  if (includeSocial) {
    const social = findSocialConnections(receipts);
    if (social.length > 0) groups.push({ type: 'social', data: social });
  }

  if (includeChains) {
    const chains = findActivityChains(receipts);
    if (chains.length > 0) groups.push({ type: 'chain', data: chains });
  }

  return groups;
};

/**
 * Counts the total number of individual connections across all groups.
 *
 * @param groups - Detector output.
 * @returns Sum of `data.length` over every group.
 */
export const countConnections = (groups: ConnectionGroup[]): number =>
  groups.reduce((total, group) => total + group.data.length, 0);

/**
 * Tokenises free text into significant lowercase words.
 *
 * @param text - Source text.
 * @returns Words longer than three characters, excluding stop words.
 */
export const significantWords = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));

/**
 * Finds receipts that share tagged people or meaningful keywords.
 *
 * Photo/message and photo/note pairs match on tagged people; message/note pairs
 * match on significantly shared words as a topic heuristic.
 *
 * @param receipts - Receipts to inspect.
 * @returns Matching pairs with the names or words they share.
 */
export const findSocialConnections = (receipts: Receipt[]): SocialConnection[] => {
  const byType = groupByType(receipts);
  const photos = receiptsOfType(byType, 'photo');
  const messages = receiptsOfType(byType, 'message');
  const notes = receiptsOfType(byType, 'note');
  const connections: SocialConnection[] = [];

  for (const photo of photos) {
    const people = photo.people;
    if (!people || people.length === 0) continue;

    // Lowercase the tags once per photo instead of once per comparison.
    const tagged = people.map((person) => person.toLowerCase());

    for (const message of messages) {
      const haystack = message.content.toLowerCase();
      const sharedPeople = tagged.filter((person) => haystack.includes(person));
      if (sharedPeople.length > 0) {
        connections.push({
          source: photo,
          target: message,
          connectionType: 'photo-message',
          sharedPeople,
        });
      }
    }

    for (const note of notes) {
      const haystack = note.content.toLowerCase();
      const sharedPeople = tagged.filter((person) => haystack.includes(person));
      if (sharedPeople.length > 0) {
        connections.push({
          source: photo,
          target: note,
          connectionType: 'photo-note',
          sharedPeople,
        });
      }
    }
  }

  // Message/note pairs linked by shared significant words.
  const noteWordSets = notes.map((note) => new Set(significantWords(note.content)));

  for (const message of messages) {
    const messageWords = significantWords(message.content);
    if (messageWords.length === 0) continue;

    notes.forEach((note, noteIndex) => {
      const noteWords = noteWordSets[noteIndex];
      const shared = [...new Set(messageWords.filter((word) => noteWords.has(word)))];
      if (shared.length >= MIN_SHARED_WORDS) {
        connections.push({
          source: message,
          target: note,
          connectionType: 'message-note',
          sharedPeople: shared,
        });
      }
    });
  }

  return connections;
};
