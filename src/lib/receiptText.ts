/**
 * One-line searchable summary of a receipt.
 *
 * @module lib/receiptText
 */

import type { Receipt } from '../types/receipt';

/** One-line searchable summary shared by the text filter and detail dialog. */
export const receiptDisplayText = (receipt: Receipt): string => {
  switch (receipt.type) {
    case 'music':
      return `${receipt.track} ${receipt.artist} ${receipt.album ?? ''}`;
    case 'movie':
      return receipt.title;
    case 'place':
      return `${receipt.name} ${receipt.category}`;
    case 'purchase':
      return `${receipt.item} ${receipt.category} ${receipt.merchant ?? ''}`;
    case 'photo':
      return `${receipt.caption ?? ''} ${receipt.location ?? ''}`;
    case 'message':
      return `${receipt.sender} ${receipt.content}`;
    case 'search':
      return receipt.query;
    case 'event':
      return `${receipt.title} ${receipt.description ?? ''} ${receipt.location ?? ''}`;
    case 'note':
      return receipt.content;
  }
};
