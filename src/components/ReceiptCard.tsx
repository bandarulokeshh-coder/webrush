import type React from 'react';
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
  // Perforated edge + monospace meta: the card reads as a paper receipt,
  // which is the entire product metaphor ("Your Life, In Receipts").
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
    <div
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
      style={{ animationDelay: `${Math.min(index, 16) * 30}ms` }}
      className={cn(
        'group relative h-full animate-[receipt-in_0.35s_ease-out_both] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow duration-200',
        'hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-black/30',
        onClick && 'cursor-pointer',
      )}
    >
      {/* Perforated receipt edge */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-0 border-l-2 border-dashed border-gray-200 dark:border-slate-700"
      />
      <div className="flex items-start gap-3 px-4 py-3 pl-5">
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
          <div className="font-mono text-[11px] tracking-tight text-gray-500 dark:text-slate-400">
            {formatTimestamp(receipt.timestamp)}
          </div>
        </div>
        <div className="font-mono text-[10px] text-gray-300 dark:text-slate-600">
          № {receipt.id.slice(-6).toUpperCase()}
        </div>
      </div>

      {/* Type-specific content */}
      <div className="border-t border-dashed border-gray-200 px-4 py-3 pl-5 dark:border-slate-800/60">
        {renderBody()}
      </div>
      {/* Barcode footer */}
      <div aria-hidden="true" className="flex h-4 items-stretch gap-[2px] px-4 pb-2 pl-5 opacity-40">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-400 dark:bg-slate-500"
            style={{ width: `${1 + ((receipt.id.charCodeAt(i % receipt.id.length) + i) % 3)}px` }}
          />
        ))}
      </div>
    </div>
  );
};

export default ReceiptCard;
