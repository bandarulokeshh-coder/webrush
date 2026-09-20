/**
 * Presentation metadata and static configuration for WebRush.
 *
 * Keeping icon/label maps here (rather than inline in components) means the
 * twelve places that need "how do we display a purchase receipt?" all read from
 * one source of truth.
 *
 * @module constants/receipts
 */

import {
  Calendar,
  Camera,
  Clock,
  Film,
  HelpCircle,
  Link2,
  MapPin,
  MessageSquare,
  Music,
  Search,
  ShoppingBag,
  StickyNote,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { ConnectionType, DatasetSource, ReceiptType } from '../types/receipt';

/** Product name used in the header, document title and footer. */
export const APP_NAME = 'WebRush';

/** One-line description of the problem being solved. */
export const APP_TAGLINE = 'Your Life, In Receipts';

/** Canonical repository URL shown in the footer. */
export const GITHUB_URL = 'https://github.com/bandarulokeshh-coder/webrush';

/** localStorage key holding the resolved theme. */
export const THEME_STORAGE_KEY = 'webrush-theme';

/** Default window within which two receipts count as temporally connected. */
export const DEFAULT_TEMPORAL_THRESHOLD_MS = 60 * 60 * 1000;

/** Lowest sensitivity setting: a tighter window yields fewer connections. */
export const MIN_TEMPORAL_THRESHOLD_MS = 5 * 60 * 1000;

/** Highest sensitivity setting: a wider window yields more connections. */
export const MAX_TEMPORAL_THRESHOLD_MS = 6 * 60 * 60 * 1000;

/** How many receipt cards are appended per "Load more" press. */
export const RECEIPT_PAGE_SIZE = 48;

/** Icon tile styling for each receipt type. */
export interface ReceiptVisual {
  Icon: LucideIcon;
  /** Tailwind gradient applied to the icon tile. */
  gradient: string;
  /** Accent colour for the receipt-type label. */
  label: string;
}

/** Icon, gradient and accent colour per receipt type. */
export const RECEIPT_VISUALS: Record<ReceiptType, ReceiptVisual> = {
  music: { Icon: Music, gradient: 'from-indigo-400 to-purple-500', label: 'text-indigo-600 dark:text-indigo-300' },
  movie: { Icon: Film, gradient: 'from-red-500 to-orange-400', label: 'text-rose-600 dark:text-rose-300' },
  place: { Icon: MapPin, gradient: 'from-green-400 to-emerald-500', label: 'text-emerald-600 dark:text-emerald-300' },
  purchase: { Icon: ShoppingBag, gradient: 'from-blue-500 to-indigo-400', label: 'text-blue-600 dark:text-blue-300' },
  photo: { Icon: Camera, gradient: 'from-pink-400 to-rose-500', label: 'text-pink-600 dark:text-pink-300' },
  message: { Icon: MessageSquare, gradient: 'from-yellow-400 to-amber-500', label: 'text-amber-600 dark:text-amber-300' },
  search: { Icon: Search, gradient: 'from-gray-400 to-slate-500', label: 'text-slate-600 dark:text-slate-300' },
  event: { Icon: Calendar, gradient: 'from-teal-400 to-cyan-500', label: 'text-teal-600 dark:text-teal-300' },
  note: { Icon: StickyNote, gradient: 'from-violet-400 to-purple-500', label: 'text-violet-600 dark:text-violet-300' },
};

/** Fallback styling for an unrecognised receipt type. */
export const FALLBACK_VISUAL: ReceiptVisual = {
  Icon: HelpCircle,
  gradient: 'from-gray-400 to-slate-500',
  label: 'text-slate-600 dark:text-slate-300',
};

/** Icon shown beside each connection type in the connections panel. */
export const CONNECTION_ICONS: Record<ConnectionType, LucideIcon> = {
  temporal: Clock,
  location: MapPin,
  artist: Music,
  'location-name': MapPin,
  social: Users,
  chain: Link2,
};

/** Short label per connection type. */
export const CONNECTION_LABELS: Record<ConnectionType, string> = {
  temporal: 'Temporal',
  location: 'Location-based',
  artist: 'Artist/Mentions',
  'location-name': 'Location Names',
  social: 'Social Connections',
  chain: 'Activity Chains',
};

/** Explanatory copy per connection type, surfaced via `aria-describedby`. */
export const CONNECTION_DESCRIPTIONS: Record<ConnectionType, string> = {
  temporal: 'Moments that happened within the sensitivity window of each other.',
  location: 'Photos tagged with a place you also visited.',
  artist: 'Notes that mention an artist you listened to.',
  'location-name': 'Events, photos or notes that name a place in your history.',
  social: 'Records that mention the same people or keywords.',
  chain: 'Runs of activity that add up to a single outing.',
};

/** The datasets a visitor can load, in display order. */
export const DATASET_SOURCES: readonly DatasetSource[] = [
  {
    id: 'mock',
    label: 'Demo data',
    path: null,
    description: 'A synthetic year of receipts, generated in the browser.',
  },
  {
    id: 'spotify',
    label: 'Spotify history',
    path: '/datasets/spotify_sample.csv',
    description: 'Real listening history with artist, track and album metadata.',
  },
  {
    id: 'transactions',
    label: 'Household spending',
    path: '/datasets/transactions_sample.csv',
    description: 'Daily household expenses recorded in INR.',
  },
  {
    id: 'indiaTransact',
    label: 'Card activity',
    path: '/datasets/india_transact_sample.csv',
    description: 'Card transactions with merchant coordinates across India.',
  },
] as const;
