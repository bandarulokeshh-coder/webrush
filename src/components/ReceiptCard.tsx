import type React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

// Import the receipt types from the canonical domain model
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
  NoteReceipt,
} from '../types/receipt';
import { FALLBACK_VISUAL, RECEIPT_VISUALS } from '../constants/receipts';
import { formatCurrency, formatDuration, formatTimestamp } from '../lib/format';

interface ReceiptCardProps {
  receipt: Receipt;
  onClick?: () => void;
  /** Position in the grid — drives the staggered entrance animation */
  index?: number;
}

const Title: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <p className={cn('text-sm font-semibold text-gray-700 dark:text-slate-100', className)}>{children}</p>
);

const Detail: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <p className={cn('text-xs text-gray-500 dark:text-slate-400', className)}>{children}</p>
);

const ReceiptCard: React.FC<ReceiptCardProps> = ({ receipt, onClick, index = 0 }) => {
  const { Icon, gradient, label } = RECEIPT_VISUALS[receipt.type] ?? FALLBACK_VISUAL;

  const renderBody = () => {
    // The switch narrows the discriminated union, so each branch sees the
    // exact variant — no `as` casts needed.
    switch (receipt.type) {
      case 'music': {
        const music: MusicReceipt = receipt;
        const duration = formatDuration(music.duration);
        return (
          <div className="space-y-1">
            <Title>{music.track}</Title>
            <Detail>
              {music.artist}
              {music.album ? ` · ${music.album}` : ''}
              {duration ? ` · ${duration}` : ''}
            </Detail>
          </div>
        );
      }
      case 'movie': {
        const movie: MovieReceipt = receipt;
        return (
          <div className="space-y-1">
            <Title>{movie.title}</Title>
            {movie.genre && movie.genre.length > 0 && <Detail>{movie.genre.join(', ')}</Detail>}
          </div>
        );
      }
      case 'place': {
        const place: PlaceReceipt = receipt;
        return (
          <div className="space-y-1">
            <Title>{place.name}</Title>
            <Detail>{place.category}</Detail>
          </div>
        );
      }
      case 'purchase': {
        const purchase: PurchaseReceipt = receipt;
        return (
          <div className="space-y-1">
            <Title>{purchase.item}</Title>
            <Detail>{formatCurrency(purchase.price, purchase.currency)}</Detail>
          </div>
        );
      }
      case 'photo': {
        const photo: PhotoReceipt = receipt;
        return (
          <div className="space-y-1">
            {photo.caption && <Title>{photo.caption}</Title>}
            <Detail>Photo</Detail>
          </div>
        );
      }
      case 'message': {
        const message: MessageReceipt = receipt;
        return (
          <div className="space-y-1">
            <Title>From: {message.sender}</Title>
            <Detail className="line-clamp-2">{message.content}</Detail>
          </div>
        );
      }
      case 'search': {
        const search: SearchReceipt = receipt;
        return (
          <div className="space-y-1">
            <Title>&quot;{search.query}&quot;</Title>
            <Detail>Search</Detail>
          </div>
        );
      }
      case 'event': {
        const event: EventReceipt = receipt;
        return (
          <div className="space-y-1">
            <Title>{event.title}</Title>
            <Detail>Event</Detail>
          </div>
        );
      }
      case 'note': {
        const note: NoteReceipt = receipt;
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
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `View ${receipt.type} receipt details` : undefined}
      className={cn(
        'group h-full rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow duration-200',
        'hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-black/30',
        onClick && 'cursor-pointer',
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
