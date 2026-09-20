// Types for the life receipts dataset
export interface MusicReceipt {
  id: string;
  type: 'music';
  timestamp: string; // ISO date
  artist: string;
  track: string;
  duration?: number; // in seconds
}

export interface MovieReceipt {
  id: string;
  type: 'movie';
  timestamp: string;
  title: string;
  genre?: string[];
  rating?: number; // out of 10
  platform?: string;
}

export interface PlaceReceipt {
  id: string;
  type: 'place';
  timestamp: string;
  name: string;
  category: string; // e.g., 'restaurant', 'park', 'museum'
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface PurchaseReceipt {
  id: string;
  type: 'purchase';
  timestamp: string;
  item: string;
  category: string; // e.g., 'electronics', 'clothing', 'food'
  price: number;
  currency: string;
  merchant?: string;
}

export interface PhotoReceipt {
  id: string;
  type: 'photo';
  timestamp: string;
  caption?: string;
  location?: string; // could be place ID or description
  people?: string[]; // tags of people in photo
}

export interface MessageReceipt {
  id: string;
  type: 'message';
  timestamp: string;
  sender: string;
  recipient?: string; // if not null, it's a direct message
  content: string;
  isRead: boolean;
}

export interface SearchReceipt {
  id: string;
  type: 'search';
  timestamp: string;
  query: string;
  resultsCount?: number;
  clickedResult?: string; // what they clicked on
}

export interface EventReceipt {
  id: string;
  type: 'event';
  timestamp: string; // start time
  endTime?: string;
  title: string;
  description?: string;
  location?: string; // could be place ID
  attendees?: string[]; // person IDs or names
}

export interface NoteReceipt {
  id: string;
  type: 'note';
  timestamp: string;
  content: string;
  tags?: string[];
}

// Union type for all receipts
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

// Helper functions for data exploration
export const groupByType = (receipts: Receipt[]) => {
  return receipts.reduce((acc, receipt) => {
    const type = receipt.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(receipt);
    return acc;
  }, {} as Record<string, Receipt[]>);
};

export const sortByTimestamp = (receipts: Receipt[]) => {
  return [...receipts].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};

export const filterByDateRange = (
  receipts: Receipt[],
  start: string,
  end: string
) => {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  return receipts.filter(
    (r) => {
      const time = new Date(r.timestamp).getTime();
      return time >= startTime && time <= endTime;
    }
  );
};

// Find connections between receipts based on temporal proximity
export const findTemporalConnections = (
  receipts: Receipt[],
  maxTimeDiffMs: number = 3600000 // 1 hour default
) => {
  const sorted = sortByTimestamp(receipts);
  const connections: Array<{
    receipt1: Receipt;
    receipt2: Receipt;
    timeDiffMs: number;
  }> = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const time1 = new Date(sorted[i].timestamp).getTime();
    const time2 = new Date(sorted[i + 1].timestamp).getTime();
    const diff = Math.abs(time2 - time1);

    if (diff <= maxTimeDiffMs) {
      connections.push({
        receipt1: sorted[i],
        receipt2: sorted[i + 1],
        timeDiffMs: diff,
      });
    }
  }

  return connections;
};

// Find connections by location (for place-related receipts)
export const findLocationConnections = (
  receipts: Receipt[]
) => {
  const placeReceipts = receipts.filter(
    (r): r is PlaceReceipt => r.type === 'place'
  );
  const photoReceipts = receipts.filter(
    (r): r is PhotoReceipt => r.type === 'photo'
  );

  const connections: Array<{
    place: PlaceReceipt;
    photo: PhotoReceipt;
  }> = [];

  // Simple matching: if photo mentions location that matches place name
  for (const place of placeReceipts) {
    for (const photo of photoReceipts) {
      if (
        photo.location &&
        photo.location.toLowerCase().includes(place.name.toLowerCase())
      ) {
        connections.push({ place, photo });
      }
    }
  }

  return connections;
};

export default {
  groupByType,
  sortByTimestamp,
  filterByDateRange,
  findTemporalConnections,
  findLocationConnections,
};
