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

// Find connections by artist (music to notes, etc.)
export const findArtistConnections = (
  receipts: Receipt[]
) => {
  // Extract artist mentions from music receipts and notes
  const musicWithArtists = receipts.filter(
    (r): r is MusicReceipt => r.type === 'music'
  );
  const notes = receipts.filter(
    (r): r is NoteReceipt => r.type === 'note'
  );

  const connections: Array<{
    music: MusicReceipt;
    note: NoteReceipt;
    artist: string;
  }> = [];

  for (const music of musicWithArtists) {
    for (const note of notes) {
      // Simple check: if artist name appears in note content
      if (
        note.content.toLowerCase().includes(music.artist.toLowerCase())
      ) {
        connections.push({ music, note, artist: music.artist });
      }
    }
  }

  return connections;
};

// Find connections by location name (broader than just photo mentions)
export const findLocationNameConnections = (
  receipts: Receipt[]
) => {
  const placeReceipts = receipts.filter(
    (r): r is PlaceReceipt => r.type === 'place'
  );
  const eventReceipts = receipts.filter(
    (r): r is EventReceipt => r.type === 'event'
  );
  const photoReceipts = receipts.filter(
    (r): r is PhotoReceipt => r.type === 'photo'
  );
  const noteReceipts = receipts.filter(
    (r): r is NoteReceipt => r.type === 'note'
  );

  const connections: Array<{
    place: PlaceReceipt;
    connectedTo: Receipt;
    connectionType: 'event' | 'photo' | 'note';
    locationMatch: string;
  }> = [];

  for (const place of placeReceipts) {
    const placeNameLower = place.name.toLowerCase();

    // Check events
    for (const event of eventReceipts) {
      if (
        event.location &&
        event.location.toLowerCase().includes(placeNameLower)
      ) {
        connections.push({
          place,
          connectedTo: event,
          connectionType: 'event',
          locationMatch: event.location
        });
      }
    }

    // Check photos
    for (const photo of photoReceipts) {
      if (
        photo.location &&
        photo.location.toLowerCase().includes(placeNameLower)
      ) {
        connections.push({
          place,
          connectedTo: photo,
          connectionType: 'photo',
          locationMatch: photo.location
        });
      }
    }

    // Check notes
    for (const note of noteReceipts) {
      if (
        note.content.toLowerCase().includes(placeNameLower)
      ) {
        connections.push({
          place,
          connectedTo: note,
          connectionType: 'note',
          locationMatch: note.content.substring(
            Math.max(0, note.content.toLowerCase().indexOf(placeNameLower) - 20),
            Math.min(note.content.length, note.content.toLowerCase().indexOf(placeNameLower) + place.name.length + 20)
          )
        });
      }
    }
  }

  return connections;
};

// Find connections by people/tags (photos, messages, notes)
export const findSocialConnections = (
  receipts: Receipt[]
) => {
  const photoReceipts = receipts.filter(
    (r): r is PhotoReceipt => r.type === 'photo'
  );
  const messageReceipts = receipts.filter(
    (r): r is MessageReceipt => r.type === 'message'
  );
  const noteReceipts = receipts.filter(
    (r): r is NoteReceipt => r.type === 'note'
  );

  const connections: Array<{
    source: Receipt;
    target: Receipt;
    connectionType: 'photo-message' | 'photo-note' | 'message-note';
    sharedPeople: string[];
  }> = [];

  // Photo to message connections (people tagged in photos mentioned in messages)
  for (const photo of photoReceipts) {
    if (!photo.people || photo.people.length === 0) continue;

    for (const message of messageReceipts) {
      const sharedPeople = photo.people.filter(person =>
        message.content.toLowerCase().includes(person.toLowerCase())
      );

      if (sharedPeople.length > 0) {
        connections.push({
          source: photo,
          target: message,
          connectionType: 'photo-message',
          sharedPeople
        });
      }
    }
  }

  // Photo to note connections
  for (const photo of photoReceipts) {
    if (!photo.people || photo.people.length === 0) continue;

    for (const note of noteReceipts) {
      const sharedPeople = photo.people.filter(person =>
        (note.content || '').toLowerCase().includes(person.toLowerCase())
      );

      if (sharedPeople.length > 0) {
        connections.push({
          source: photo,
          target: note,
          connectionType: 'photo-note',
          sharedPeople
        });
      }
    }
  }

  // Message to note connections
  for (const message of messageReceipts) {
    for (const note of noteReceipts) {
      // Simple heuristic: if they mention similar topics or were close in time
      // For now, we'll look for common proper nouns (simplified)
      const messageWords = message.content.split(/\s+/);
      const noteWords = (note.content || '').split(/\s+/);
      const shared = messageWords.filter(word =>
        noteWords.includes(word) && word.length > 3
      );

      if (shared.length >= 2) { // At least 2 shared meaningful words
        connections.push({
          source: message,
          target: note,
          connectionType: 'message-note',
          sharedPeople: shared // Reusing field for simplicity
        });
      }
    }
  }

  return connections;
};

// Find activity chains (sequences that might represent an activity)
// e.g., Music -> Place -> Photo -> Purchase (going out)
export const findActivityChains = (
  receipts: Receipt[],
  maxTimeBetween: number = 10800000 // 3 hours
) => {
  const sorted = sortByTimestamp(receipts);
  const chains: Array<{
    receipts: Receipt[];
    startTime: string;
    endTime: string;
    durationMs: number;
    description: string;
  }> = [];

  let currentChain: Receipt[] = [];

  for (let i = 0; i < sorted.length; i++) {
    if (currentChain.length === 0) {
      currentChain.push(sorted[i]);
      continue;
    }

    const lastTime = new Date(currentChain[currentChain.length - 1].timestamp).getTime();
    const currentTime = new Date(sorted[i].timestamp).getTime();

    if (currentTime - lastTime <= maxTimeBetween) {
      currentChain.push(sorted[i]);
    } else {
      // Chain ended, save it if it has multiple receipts
      if (currentChain.length >= 2) {
        const startTime = new Date(currentChain[0].timestamp).getTime();
        const endTime = new Date(currentChain[currentChain.length - 1].timestamp).getTime();

        chains.push({
          receipts: [...currentChain],
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          durationMs: endTime - startTime,
          description: generateChainDescription(currentChain)
        });
      }

      // Start new chain
      currentChain = [sorted[i]];
    }
  }

  // Don't forget the last chain
  if (currentChain.length >= 2) {
    const startTime = new Date(currentChain[0].timestamp).getTime();
    const endTime = new Date(currentChain[currentChain.length - 1].timestamp).getTime();

    chains.push({
      receipts: [...currentChain],
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      durationMs: endTime - startTime,
      description: generateChainDescription(currentChain)
    });
  }

  return chains;
};

// Helper to generate a description for an activity chain
function generateChainDescription(receipts: Receipt[]): string {
  const types = [...new Set(receipts.map(r => r.type))];
  const typeMap: Record<string, string> = {
    music: '🎵 Music',
    movie: '🎬 Movie',
    place: '📍 Place',
    purchase: '🛒 Purchase',
    photo: '📸 Photo',
    message: '💬 Message',
    search: '🔍 Search',
    event: '📅 Event',
    note: '📝 Note'
  };

  const typeLabels = types.map(t => typeMap[t] || t).join(' → ');
  return `Activity chain: ${typeLabels} (${receipts.length} moments)`;
}

// Enhanced connection finder that uses multiple strategies
export const findAllConnections = (
  receipts: Receipt[],
  options: {
    temporalThresholdMs?: number;
    includeLocation?: boolean;
    includeArtist?: boolean;
    includeSocial?: boolean;
    includeChains?: boolean;
  } = {}
) => {
  const {
    temporalThresholdMs = 3600000,
    includeLocation = true,
    includeArtist = true,
    includeSocial = true,
    includeChains = true
  } = options;

  const allConnections: Array<{
    type: 'temporal' | 'location' | 'artist' | 'location-name' | 'social' | 'chain';
    data: any;
  }> = [];

  // Temporal connections
  const temporal = findTemporalConnections(receipts, temporalThresholdMs);
  if (temporal.length > 0) {
    allConnections.push({
      type: 'temporal',
      data: temporal
    });
  }

  // Location-based connections
  if (includeLocation) {
    const location = findLocationConnections(receipts);
    if (location.length > 0) {
      allConnections.push({
        type: 'location',
        data: location
      });
    }

    const locationName = findLocationNameConnections(receipts);
    if (locationName.length > 0) {
      allConnections.push({
        type: 'location-name',
        data: locationName
      });
    }
  }

  // Artist connections
  if (includeArtist) {
    const artist = findArtistConnections(receipts);
    if (artist.length > 0) {
      allConnections.push({
        type: 'artist',
        data: artist
      });
    }
  }

  // Social connections
  if (includeSocial) {
    const social = findSocialConnections(receipts);
    if (social.length > 0) {
      allConnections.push({
        type: 'social',
        data: social
      });
    }
  }

  // Activity chains
  if (includeChains) {
    const chains = findActivityChains(receipts);
    if (chains.length > 0) {
      allConnections.push({
        type: 'chain',
        data: chains
      });
    }
  }

  return allConnections;
};

export default {
  groupByType,
  sortByTimestamp,
  filterByDateRange,
  findTemporalConnections,
  findLocationConnections,
  findArtistConnections,
  findLocationNameConnections,
  findSocialConnections,
  findActivityChains,
  findAllConnections
};
