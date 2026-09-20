import React from 'react';
import { motion } from 'motion/react';
import {
  Music,
  Film,
  MapPin,
  ShoppingBag,
  Camera,
  MessageSquare,
  Search,
  Calendar,
  StickyNote,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../lib/utils';

// Import the receipt types from our utils
import type {
  Receipt,
  MusicReceipt,
  MovieReceipt,
  PlaceReceipt,
  PurchaseReceipt,
  PhotoReceipt,
  MessageReceipt,
  SearchReceipt,
  EventReceipt,
  NoteReceipt
} from '../utils/data';

interface ReceiptCardProps {
  receipt: Receipt;
  onClick?: () => void;
  /** Position in the grid — drives the staggered entrance animation */
  index?: number;
}

interface IconStyle {
  Icon: LucideIcon;
  /** Gradient applied to the icon tile */
  gradient: string;
  /** Accent color for the receipt-type label */
  label: string;
}

const ICON_STYLES: Record<string, IconStyle> = {
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

const FALLBACK_STYLE: IconStyle = {
  Icon: HelpCircle,
  gradient: 'from-gray-400 to-slate-500',
  label: 'text-slate-600 dark:text-slate-300',
};

// Format timestamp for display
const formatTimestamp = (timestamp: string) =>
  new Date(timestamp).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

const Title: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <p className={cn('text-sm font-semibold text-gray-700 dark:text-slate-100', className)}>{children}</p>
);

const Detail: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <p className={cn('text-xs text-gray-500 dark:text-slate-400', className)}>{children}</p>
);

const ReceiptCard: React.FC<ReceiptCardProps> = ({ receipt, onClick, index = 0 }) => {
  const { Icon, gradient, label } = ICON_STYLES[receipt.type] ?? FALLBACK_STYLE;

  const renderBody = () => {
    switch (receipt.type) {
      case 'music': {
        const music = receipt as MusicReceipt;
        return (
          <div className="space-y-1">
            <Title>{music.track}</Title>
            <Detail>
              {music.artist}
              {music.album ? ` · ${music.album}` : ''}
            </Detail>
          </div>
        );
      }
      case 'movie': {
        const movie = receipt as MovieReceipt;
        return (
          <div className="space-y-1">
            <Title>{movie.title}</Title>
            {movie.genre && movie.genre.length > 0 && <Detail>{movie.genre.join(', ')}</Detail>}
          </div>
        );
      }
      case 'place': {
        const place = receipt as PlaceReceipt;
        return (
          <div className="space-y-1">
            <Title>{place.name}</Title>
            <Detail>{place.category}</Detail>
          </div>
        );
      }
      case 'purchase': {
        const purchase = receipt as PurchaseReceipt;
        return (
          <div className="space-y-1">
            <Title>{purchase.item}</Title>
            <Detail>
              {purchase.price} {purchase.currency}
            </Detail>
          </div>
        );
      }
      case 'photo': {
        const photo = receipt as PhotoReceipt;
        return (
          <div className="space-y-1">
            {photo.caption && <Title>{photo.caption}</Title>}
            <Detail>Photo</Detail>
          </div>
        );
      }
      case 'message': {
        const message = receipt as MessageReceipt;
        return (
          <div className="space-y-1">
            <Title>From: {message.sender}</Title>
            <Detail className="line-clamp-2">{message.content}</Detail>
          </div>
        );
      }
      case 'search': {
        const search = receipt as SearchReceipt;
        return (
          <div className="space-y-1">
            <Title>&quot;{search.query}&quot;</Title>
            <Detail>Search</Detail>
          </div>
        );
      }
      case 'event': {
        const event = receipt as EventReceipt;
        return (
          <div className="space-y-1">
            <Title>{event.title}</Title>
            <Detail>Event</Detail>
          </div>
        );
      }
      case 'note': {
        const note = receipt as NoteReceipt;
        return (
          <div className="space-y-1">
            <Title className="line-clamp-2">{note.content}</Title>
            <Detail>Note</Detail>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, delay: Math.min(index, 16) * 0.02, ease: 'easeOut' }}
      whileHover={onClick ? { y: -4 } : undefined}
      onClick={onClick}
      className={cn(
        'group h-full rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow duration-200',
        'hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-black/30',
        onClick && 'cursor-pointer'
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm',
            'transition-transform duration-200 group-hover:scale-105',
            gradient
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <div className="flex-1 space-y-0.5">
          <div className={cn('text-sm font-medium capitalize', label)}>{receipt.type}</div>
          <div className="text-xs text-gray-500 dark:text-slate-400">{formatTimestamp(receipt.timestamp)}</div>
        </div>
      </div>

      {/* Type-specific content */}
      <div className="border-t border-gray-50 px-4 py-3 dark:border-slate-800/60">{renderBody()}</div>
    </motion.div>
  );
};

export default ReceiptCard;
