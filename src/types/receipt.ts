/**
 * Domain model for WebRush — "Your Life, In Receipts".
 *
 * A *receipt* is one timestamped moment from a person's digital life. Every
 * receipt carries an `id` and an ISO-8601 `timestamp`, so heterogeneous records
 * can be merged into a single chronological timeline. The `type` field is the
 * discriminant that drives rendering, filtering and connection detection.
 *
 * @module types/receipt
 */

/** Every receipt kind the app understands, in canonical display order. */
export const RECEIPT_TYPES = [
  'music',
  'movie',
  'place',
  'purchase',
  'photo',
  'message',
  'search',
  'event',
  'note',
] as const;

/** Union of the supported receipt discriminants. */
export type ReceiptType = (typeof RECEIPT_TYPES)[number];

/** Fields shared by every receipt variant. */
export interface BaseReceipt {
  /** Stable unique identifier, also used as the React key. */
  id: string;
  /** ISO-8601 timestamp; receipt ordering is derived from this. */
  timestamp: string;
}

/** A track play, typically sourced from Spotify listening history. */
export interface MusicReceipt extends BaseReceipt {
  type: 'music';
  artist: string;
  track: string;
  album?: string;
  /** Playback length in seconds. */
  duration?: number;
}

/** A film or show watched on a streaming platform. */
export interface MovieReceipt extends BaseReceipt {
  type: 'movie';
  title: string;
  genre?: string[];
  /** Rating out of 10. */
  rating?: number;
  platform?: string;
}

/** A visited location such as a shop, restaurant or landmark. */
export interface PlaceReceipt extends BaseReceipt {
  type: 'place';
  name: string;
  category: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

/** A payment, sourced from household or card transaction datasets. */
export interface PurchaseReceipt extends BaseReceipt {
  type: 'purchase';
  item: string;
  category: string;
  price: number;
  currency: string;
  merchant?: string;
}

/** A captured photo and its inferred location/people metadata. */
export interface PhotoReceipt extends BaseReceipt {
  type: 'photo';
  caption?: string;
  location?: string;
  people?: string[];
}

/** A direct or group message. */
export interface MessageReceipt extends BaseReceipt {
  type: 'message';
  sender: string;
  recipient?: string;
  content: string;
  isRead: boolean;
}

/** A search query and the interaction that followed it. */
export interface SearchReceipt extends BaseReceipt {
  type: 'search';
  query: string;
  resultsCount?: number;
  clickedResult?: string;
}

/** A calendar event or meet-up. */
export interface EventReceipt extends BaseReceipt {
  type: 'event';
  title: string;
  endTime?: string;
  description?: string;
  location?: string;
  attendees?: string[];
}

/** A free-form personal note. */
export interface NoteReceipt extends BaseReceipt {
  type: 'note';
  content: string;
  tags?: string[];
}

/** Discriminated union of every receipt variant. */
export type Receipt =
  | MusicReceipt
  | MovieReceipt
  | PlaceReceipt
  | PurchaseReceipt
  | PhotoReceipt
  | MessageReceipt
  | SearchReceipt
  | EventReceipt
  | NoteReceipt;

/** Narrows {@link Receipt} to a single variant, e.g. `ReceiptOfType<'music'>`. */
export type ReceiptOfType<T extends ReceiptType> = Extract<Receipt, { type: T }>;

/* -------------------------------------------------------------------------- */
/*                              Connection model                              */
/* -------------------------------------------------------------------------- */

/** Two receipts that happened close together in time. */
export interface TemporalConnection {
  receipt1: Receipt;
  receipt2: Receipt;
  timeDiffMs: number;
}

/** A photo whose location string mentions a known place. */
export interface LocationConnection {
  place: PlaceReceipt;
  photo: PhotoReceipt;
}

/** A note that mentions an artist the user listened to. */
export interface ArtistConnection {
  music: MusicReceipt;
  note: NoteReceipt;
  artist: string;
}

/** A place referenced by an event, photo or note. */
export interface LocationNameConnection {
  place: PlaceReceipt;
  connectedTo: Receipt;
  connectionType: 'event' | 'photo' | 'note';
  locationMatch: string;
}

/** Two receipts that share a person or meaningful keyword. */
export interface SocialConnection {
  source: Receipt;
  target: Receipt;
  connectionType: 'photo-message' | 'photo-note' | 'message-note';
  sharedPeople: string[];
}

/** A run of receipts that form one continuous activity (e.g. a night out). */
export interface ActivityChain {
  receipts: Receipt[];
  startTime: string;
  endTime: string;
  durationMs: number;
  description: string;
}

/** Every connection strategy the engine implements. */
export type ConnectionType =
  | 'temporal'
  | 'location'
  | 'artist'
  | 'location-name'
  | 'social'
  | 'chain';

/**
 * A single connection strategy's results.
 *
 * Modelling this as a discriminated union (rather than `{ type, data: any }`)
 * lets consumers switch on `group.type` and receive a fully-typed `group.data`,
 * removing the defensive `conn.receipt1 || conn.source || ...` probing that
 * untyped data forced on the UI layer.
 */
export type ConnectionGroup =
  | { type: 'temporal'; data: TemporalConnection[] }
  | { type: 'location'; data: LocationConnection[] }
  | { type: 'artist'; data: ArtistConnection[] }
  | { type: 'location-name'; data: LocationNameConnection[] }
  | { type: 'social'; data: SocialConnection[] }
  | { type: 'chain'; data: ActivityChain[] };

/** Toggles and thresholds controlling connection detection. */
export interface ConnectionOptions {
  /** Maximum gap, in ms, for two receipts to count as temporally connected. */
  temporalThresholdMs?: number;
  /** Run the temporal (time-proximity) detector. Defaults to true. */
  includeTemporal?: boolean;
  /** Run the photo ↔ place coordinate/name detector. Defaults to true. */
  includeLocation?: boolean;
  /** Run the broader place-name detector (events, photos, notes). Defaults to true. */
  includeLocationName?: boolean;
  /** Run the artist-mention detector. Defaults to true. */
  includeArtist?: boolean;
  /** Run the social (shared people / keywords) detector. Defaults to true. */
  includeSocial?: boolean;
  /** Run the activity-chain detector. Defaults to true. */
  includeChains?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                 Datasets                                   */
/* -------------------------------------------------------------------------- */

/** Identifier for each bundled dataset the user can load. */
export type DatasetId = 'mock' | 'spotify' | 'transactions' | 'indiaTransact';

/** Lifecycle state of a dataset load. */
export type DatasetStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Static description of a loadable dataset. */
export interface DatasetSource {
  id: DatasetId;
  /** Human-readable label shown on the toggle control. */
  label: string;
  /** Public URL the CSV is fetched from, or `null` for generated data. */
  path: string | null;
  description: string;
}

/** Runtime state of a single dataset. */
export interface DatasetState {
  status: DatasetStatus;
  /** Number of receipts produced by this dataset. */
  count: number;
  /** Populated only when `status === 'error'`. */
  error?: string;
}

/** Map of dataset id to its runtime state. */
export type DatasetStateMap = Record<DatasetId, DatasetState>;

/** A derived, human-readable observation about the loaded receipts. */
export interface Insight {
  id: string;
  label: string;
  value: string;
  detail?: string;
}
