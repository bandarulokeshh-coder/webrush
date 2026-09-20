import React, { useState, useEffect } from 'react';
import ReceiptCard from './components/ReceiptCard';
import {
  Receipt,
  groupByType,
  sortByTimestamp,
  findTemporalConnections,
  findLocationConnections,
  findArtistConnections,
  findLocationNameConnections,
  findSocialConnections,
  findActivityChains,
  findAllConnections
} from './utils/data';
import './App.css';

// Mock data generator for demonstration
const generateMockData = (): Receipt[] => {
  const receipts: Receipt[] = [];

  // Helper to generate random timestamp within a range
  const randomTimestamp = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
  };

  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-12-31');

  // Music receipts
  const artists = ['The Weeknd', 'Taylor Swift', 'Drake', 'Billie Eilish', 'Ed Sheeran'];
  const tracks = ['Blinding Lights', 'Anti-Hero', 'God\'s Plan', 'Bad Guy', 'Shape of You'];
  for (let i = 0; i < 15; i++) {
    receipts.push({
      id: `music_${i}`,
      type: 'music',
      timestamp: randomTimestamp(startDate, endDate),
      artist: artists[i % artists.length],
      track: tracks[i % tracks.length],
      duration: 180 + Math.random() * 120
    });
  }

  // Movie receipts
  const movies = [
    { title: 'Inception', genre: ['Sci-Fi', 'Thriller'] },
    { title: 'Parasite', genre: ['Thriller', 'Drama'] },
    { title: 'Everything Everywhere All at Once', genre: ['Sci-Fi', 'Comedy', 'Drama'] },
    { title: 'Top Gun: Maverick', genre: ['Action', 'Drama'] },
    { title: 'Spider-Man: Across the Spider-Verse', genre: ['Animation', 'Action', 'Adventure'] }
  ];
  for (let i = 0; i < 10; i++) {
    receipts.push({
      id: `movie_${i}`,
      type: 'movie',
      timestamp: randomTimestamp(startDate, endDate),
      title: movies[i % movies.length].title,
      genre: movies[i % movies.length].genre,
      rating: 6 + Math.random() * 4,
      platform: ['Netflix', 'Disney+', 'HBO Max', 'Amazon Prime', 'Theater'][Math.floor(Math.random() * 5)]
    });
  }

  // Place receipts
  const places = [
    { name: 'Central Park', category: 'park' },
    { name: 'Starbucks Downtown', category: 'cafe' },
    { name: 'Metropolitan Museum', category: 'museum' },
    { name: 'Grand Central Terminal', category: 'transit' },
    { name: 'Brooklyn Bridge', category: 'landmark' }
  ];
  for (let i = 0; i < 12; i++) {
    receipts.push({
      id: `place_${i}`,
      type: 'place',
      timestamp: randomTimestamp(startDate, endDate),
      name: places[i % places.length].name,
      category: places[i % places.length].category,
      latitude: 40.7 + Math.random() * 0.1,
      longitude: -74.0 + Math.random() * 0.1
    });
  }

  // Purchase receipts
  const purchases = [
    { item: 'Wireless Headphones', category: 'electronics', price: 199 },
    { item: 'Coffee Maker', category: 'appliances', price: 89 },
    { item: 'Novel', category: 'books', price: 15 },
    { item: 'Sneakers', category: 'clothing', price: 120 },
    { item: 'Groceries', category: 'food', price: 75 }
  ];
  for (let i = 0; i < 20; i++) {
    receipts.push({
      id: `purchase_${i}`,
      type: 'purchase',
      timestamp: randomTimestamp(startDate, endDate),
      item: purchases[i % purchases.length].item,
      category: purchases[i % purchases.length].category,
      price: purchases[i % purchases.length].price,
      currency: 'USD',
      merchant: ['Amazon', 'Walmart', 'Target', 'Best Buy', 'Local Store'][Math.floor(Math.random() * 5)]
    });
  }

  // Photo receipts
  for (let i = 0; i < 18; i++) {
    receipts.push({
      id: `photo_${i}`,
      type: 'photo',
      timestamp: randomTimestamp(startDate, endDate),
      caption: ['Weekend brunch', 'City skyline', 'Friends gathering', 'Nature hike', 'Concert'][Math.floor(Math.random() * 5)],
      location: ['Central Park', 'Downtown', 'Brooklyn', 'Queens', ''][Math.floor(Math.random() * 5)]
    });
  }

  // Message receipts
  const senders = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Casey'];
  for (let i = 0; i < 25; i++) {
    receipts.push({
      id: `message_${i}`,
      type: 'message',
      timestamp: randomTimestamp(startDate, endDate),
      sender: senders[i % senders.length],
      content: ['Hey! How are you?', 'Did you see that?', 'Running late sorry', 'Thanks for yesterday!', 'Want to meet up?'][Math.floor(Math.random() * 5)],
      isRead: Math.random() > 0.3
    });
  }

  // Search receipts
  const queries = ['best restaurants nyc', 'how to fix leaky faucet', 'upcoming concerts', 'weather forecast', 'python tutorial'];
  for (let i = 0; i < 12; i++) {
    receipts.push({
      id: `search_${i}`,
      type: 'search',
      timestamp: randomTimestamp(startDate, endDate),
      query: queries[i % queries.length],
      resultsCount: Math.floor(Math.random() * 1000000)
    });
  }

  // Event receipts
  const events = [
    { title: 'Jazz Concert in the Park', description: 'Live jazz performance' },
    { title: 'Tech Meetup', description: 'Monthly developer gathering' },
    { title: 'Art Exhibition Opening', description: 'Contemporary art showcase' },
    { title: 'Food Festival', description: 'International cuisine celebration' },
    { title: 'Outdoor Movie Night', description: 'Classic films under the stars' }
  ];
  for (let i = 0; i < 8; i++) {
    receipts.push({
      id: `event_${i}`,
      type: 'event',
      timestamp: randomTimestamp(startDate, endDate),
      title: events[i % events.length].title,
      description: events[i % events.length].description,
      location: ['Central Park', 'Downtown Tech Hub', 'Modern Art Museum', 'Williamsburg', 'Prospect Park'][Math.floor(Math.random() * 5)]
    });
  }

  // Note receipts
  const notes = [
    'Had a great idea for a project while walking in the park',
    'Need to remember to call mom tomorrow',
    'Interesting article about AI ethics to read later',
    'Recipe for that amazing pasta dish',
    'Workout plan: 3x week strength training'
  ];
  for (let i = 0; i < 10; i++) {
    receipts.push({
      id: `note_${i}`,
      type: 'note',
      timestamp: randomTimestamp(startDate, endDate),
      content: notes[i % notes.length],
      tags: ['idea', 'reminder', 'recipe', 'workout', 'read-later'][Math.floor(Math.random() * 5)]
    });
  }

  return receipts;
};

const App: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [allConnections, setAllConnections] = useState<Array<{
    type: 'temporal' | 'location' | 'artist' | 'location-name' | 'social' | 'chain';
    data: any;
  }>>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [timeDiffThreshold, setTimeDiffThreshold] = useState<number>(3600000); // 1 hour in ms
  const [selectedConnectionTypes, setSelectedConnectionTypes] = useState<Set<string>>(new Set(['temporal']));

  // Initialize with mock data
  useEffect(() => {
    const mockData = generateMockData();
    setReceipts(mockData);
    setFilteredReceipts(mockData);

    // Calculate initial connections
    const allConnections = findAllConnections(mockData, {
      temporalThresholdMs: timeDiffThreshold,
      includeLocation: true,
      includeArtist: true,
      includeSocial: true,
      includeChains: true
    });
    setAllConnections(allConnections);
  }, [timeDiffThreshold]);

  // Filter receipts by type
  useEffect(() => {
    if (selectedType === 'all') {
      setFilteredReceipts(receipts);
    } else {
      setFilteredReceipts(receipts.filter(r => r.type === selectedType));
    }
  }, [receipts, selectedType]);

  // Recalculate connections when threshold or selected types change
  useEffect(() => {
    if (receipts.length > 0) {
      const allConnections = findAllConnections(receipts, {
        temporalThresholdMs: timeDiffThreshold,
        includeLocation: selectedConnectionTypes.has('location'),
        includeArtist: selectedConnectionTypes.has('artist'),
        includeSocial: selectedConnectionTypes.has('social'),
        includeChains: selectedConnectionTypes.has('chain')
      });
      setAllConnections(allConnections);
    }
  }, [receipts, timeDiffThreshold, selectedConnectionTypes]);

  const typeOptions = [
    { label: 'All Types', value: 'all' },
    { label: '🎵 Music', value: 'music' },
    { label: '🎬 Movies', value: 'movie' },
    { label: '📍 Places', value: 'place' },
    { label: '🛒 Purchases', value: 'purchase' },
    { label: '📸 Photos', value: 'photo' },
    { label: '💬 Messages', value: 'message' },
    { label: '🔍 Searches', value: 'search' },
    { label: '📅 Events', value: 'event' },
    { label: '📝 Notes', value: 'note' }
  ];

  // Helper to get display text for a receipt
  const getReceiptDisplayText = (receipt: Receipt): string => {
    switch (receipt.type) {
      case 'music':
        return (receipt as MusicReceipt).track;
      case 'movie':
        return (receipt as MovieReceipt).title;
      case 'place':
        return (receipt as PlaceReceipt).name;
      case 'purchase':
        return (receipt as PurchaseReceipt).item;
      case 'photo':
        return (receipt as PhotoReceipt).caption || 'Photo';
      case 'message':
        return (receipt as MessageReceipt).sender;
      case 'search':
        return `"${(receipt as SearchReceipt).query}"`;
      case 'event':
        return (receipt as EventReceipt).title;
      case 'note':
        return (receipt as NoteReceipt).content.substring(0, 30) + (receipt as NoteReceipt).content.length > 30 ? '...' : '';
      default:
        return receipt.type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Your Life, In Receipts
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          Explore the connections in your digital life - transform disconnected moments into meaningful stories
        </p>
      </header>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-4 items-start">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Type:
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {typeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Connection Sensitivity (time threshold):
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="300000"
                  max="7200000"
                  step="300000"
                  value={timeDiffThreshold}
                  onChange={(e) => setTimeDiffThreshold(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500">
                  {Math.round(timeDiffThreshold / 60000)} min
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-[200px] mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Connection Types:
              </label>
              <div className="grid gap-2 grid-cols-2">
                <label className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedConnectionTypes.has('temporal')}
                    onChange={(e) => {
                      const newSet = new Set(selectedConnectionTypes);
                      if (e.target.checked) {
                        newSet.add('temporal');
                      } else {
                        newSet.delete('temporal');
                      }
                      setSelectedConnectionTypes(newSet);
                    }}
                    className="h-4 w-4 text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Temporal (time)</span>
                </label>
                <label className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedConnectionTypes.has('location')}
                    onChange={(e) => {
                      const newSet = new Set(selectedConnectionTypes);
                      if (e.target.checked) {
                        newSet.add('location');
                      } else {
                        newSet.delete('location');
                      }
                      setSelectedConnectionTypes(newSet);
                    }}
                    className="h-4 w-4 text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Location</span>
                </label>
                <label className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedConnectionTypes.has('artist')}
                    onChange={(e) => {
                      const newSet = new Set(selectedConnectionTypes);
                      if (e.target.checked) {
                        newSet.add('artist');
                      } else {
                        newSet.delete('artist');
                      }
                      setSelectedConnectionTypes(newSet);
                    }}
                    className="h-4 w-4 text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Artist/Mention</span>
                </label>
                <label className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedConnectionTypes.has('social')}
                    onChange={(e) => {
                      const newSet = new Set(selectedConnectionTypes);
                      if (e.target.checked) {
                        newSet.add('social');
                      } else {
                        newSet.delete('social');
                      }
                      setSelectedConnectionTypes(newSet);
                    }}
                    className="h-4 w-4 text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Social (People)</span>
                </label>
                <label className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedConnectionTypes.has('chain')}
                    onChange={(e) => {
                      const newSet = new Set(selectedConnectionTypes);
                      if (e.target.checked) {
                        newSet.add('chain');
                      } else {
                        newSet.delete('chain');
                      }
                      setSelectedConnectionTypes(newSet);
                    }}
                    className="h-4 w-4 text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Activity Chains</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Stats Panel */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Overview
            </h2>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Total Receipts:</p>
                  <p className="font-medium text-gray-800">{receipts.length}</p>
                </div>
                <div>
                  <p className="text-gray-500">Filtered View:</p>
                  <p className="font-medium text-gray-800">{filteredReceipts.length}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date Range:</p>
                  <p className="font-medium text-gray-800">
                    {receipts.length > 0 ? (
                      `${new Date(Math.min(...receipts.map(r => new Date(r.timestamp).getTime()))).toLocaleDateString()} - ` +
                      `${new Date(Math.max(...receipts.map(r => new Date(r.timestamp).getTime()))).toLocaleDateString()}`
                    ) : 'No data'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Connections Found</h3>
                <div className="space-y-1">
                  {allConnections.map(connType => {
                    const count = connType.data.length || (connType.data.receipts ? 1 : 0);
                    const typeLabels: Record<string, string> = {
                      temporal: '⏰ Temporal',
                      location: '📍 Location-based',
                      artist: '🎵 Artist/Mentions',
                      'location-name': '📍 Location Names',
                      social: '👥 Social Connections',
                      chain: '🔗 Activity Chains'
                    };
                    return (
                      <div key={connType.type} className="flex justify-between text-sm">
                        <span>{typeLabels[connType.type] || connType.type}:</span>
                        <span className="font-medium text-gray-800">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Receipts Grid */}
        <div className="col-span-2 bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {selectedType === 'all' ? 'All Receipts' : `${typeOptions.find(o => o.value === selectedType)?.label} Receipts`}
            </h2>

            {filteredReceipts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No receipts match the current filters.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredReceipts.map(receipt => (
                  <ReceiptCard
                    key={receipt.id}
                    receipt={receipt}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Connections Visualization */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Discovered Connections
            </h2>
            <p className="text-gray-600 mb-4">
              Explore different types of connections in your digital life
            </p>

            {allConnections.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No connections found with current filters.</p>
            ) : (
              <>
                {/* Connection type summary */}
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <div className="flex flex-wrap gap-2">
                    {allConnections.map(connType => {
                      const count = connType.data.length || (connType.data.receipts ? 1 : 0);
                      const typeLabels: Record<string, string> = {
                        temporal: '⏰ Temporal',
                        location: '📍 Location-based',
                        artist: '🎵 Artist/Mentions',
                        'location-name': '📍 Location Names',
                        social: '👥 Social Connections',
                        chain: '🔗 Activity Chains'
                      };
                      const isSelected = selectedConnectionTypes.has(connType.type);
                      return (
                        <span
                          key={connType.type}
                          className={`px-3 py-1 rounded text-sm ${isSelected ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-200 text-gray-600'}`
                        >
                          {typeLabels[connType.type] || connType.type}: {count}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Detailed connections */}
                <div className="space-y-4">
                  {allConnections.map((connType, typeIndex) => {
                    // Skip if not selected
                    if (!selectedConnectionTypes.has(connType.type)) return null;

                    let title: string;
                    let icon: string;
                    const typeLabels: Record<string, {title: string; icon: string}> = {
                      temporal: {title: 'Temporal Connections', icon: '⏰'},
                      location: {title: 'Location-Based Connections', icon: '📍'},
                      artist: {title: 'Artist & Mention Connections', icon: '🎵'},
                      'location-name': {title: 'Location Name Matches', icon: '📍'},
                      social: {title: 'Social Connections (People)', icon: '👥'},
                      chain: {title: 'Activity Chains', icon: '🔗'}
                    };

                    const labelInfo = typeLabels[connType.type] || {title: connType.type, icon: '🔗'};
                    title = labelInfo.title;
                    icon = labelInfo.icon;

                    // Handle different data types
                    if (connType.type === 'chain') {
                      const chains = connType.data as Array<{
                        receipts: Receipt[];
                        startTime: string;
                        endTime: string;
                        durationMs: number;
                        description: string;
                      }>;

                      return (
                        <div key={typeIndex} className="border-l-4 border-indigo-200 pl-3 py-2">
                          <div className="flex items-start space-x-3 mb-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-indigo-600">
                              {icon}
                            </div>
                            <div className="flex-1 space-y-1">
                              <h3 className="font-medium text-gray-800">{title}</h3>
                              <p className="text-sm text-gray-600">
                                Found {chains.length} activity chains representing potential experiences
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {chains.slice(0, 3).map((chain, chainIndex) => (
                              <div key={chainIndex} className="p-2 bg-indigo-50 rounded">
                                <div className="text-sm font-medium text-gray-800">
                                  {chain.description}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(chain.startTime).toLocaleTimeString()} → {new Date(chain.endTime).toLocaleTimeString()}
                                </div>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {chain.receipts.map((receipt, rIndex) => (
                                    <span key={rIndex} className="px-2 py-0.5 text-xs bg-gray-200 rounded">
                                      {receipt.type}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                            {chains.length > 3 && (
                              <p className="text-center text-sm text-gray-500 mt-2">
                                and {chains.length - 3} more chains...
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // For regular connection types (arrays of pairs)
                    const connectionsArray = connType.data as Array<any>;

                    return (
                      <div key={typeIndex} className="border-l-4 border-indigo-200 pl-3 py-2">
                        <div className="flex items-start space-x-3 mb-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-indigo-600">
                            {icon}
                          </div>
                          <div className="flex-1 space-y-1">
                            <h3 className="font-medium text-gray-800">{title}</h3>
                            <p className="text-sm text-gray-600">
                              Found {connectionsArray.length} connections
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {connectionsArray.slice(0, 3).map((conn, connIndex) => {
                            // Handle different connection types
                            let receipt1: Receipt;
                            let receipt2: Receipt;
                            let connectionInfo: string;

                            switch (connType.type) {
                              case 'temporal':
                                receipt1 = conn.receipt1;
                                receipt2 = conn.receipt2;
                                connectionInfo = `${Math.round((new Date(conn.receipt2.timestamp).getTime() - new Date(conn.receipt1.timestamp).getTime()) / 60000)} min apart`;
                                break;
                              case 'location':
                                receipt1 = conn.place;
                                receipt2 = conn.photo;
                                connectionInfo = 'Photo taken at or near this place';
                                break;
                              case 'artist':
                                receipt1 = conn.music;
                                receipt2 = conn.note;
                                connectionInfo = `Artist: ${conn.artist}`;
                                break;
                              case 'location-name':
                                receipt1 = conn.place;
                                receipt2 = conn.connectedTo;
                                connectionInfo = `Location: "${conn.locationMatch}"`;
                                break;
                              case 'social':
                                receipt1 = conn.source;
                                receipt2 = conn.target;
                                connectionInfo = `Shared: ${conn.sharedPeople.join(', ')}`;
                                break;
                              default:
                                receipt1 = conn.receipt1 || conn.source || conn.place || conn.music;
                                receipt2 = conn.receipt2 || conn.target || conn.photo || conn.note;
                                connectionInfo = 'Connected';
                            }

                            return (
                              <div key={connIndex} className="p-2 bg-indigo-50 rounded">
                                <div className="flex items-start space-x-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-indigo-600">
                                    🔗
                                  </div>
                                  <div className="flex-1 space-y-1 text-sm">
                                    <div className="flex justify-between text-gray-700">
                                      <span>
                                        {receipt1.type === receipt2.type ?
                                          `${receipt1.type}` :
                                          `${receipt1.type} → ${receipt2.type}`}
                                      </span>
                                      <span className="text-gray-500">
                                        {connectionInfo}
                                      </span>
                                    </div>
                                    <div className="text-gray-600">
                                      <span className="font-medium">{getReceiptDisplayText(receipt1)}</span>
                                      {' → '}
                                      <span className="font-medium">{getReceiptDisplayText(receipt2)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {connectionsArray.length > 3 && (
                            <p className="text-center text-sm text-gray-500 mt-2">
                              and {connectionsArray.length - 3} more connections...
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-8 text-center text-gray-500 text-sm">
        Built for WebRush Hackathon • Frontend-only solution •
        <a href="#" className="text-indigo-600 hover:underline">
          View on GitHub
        </a>
      </footer>
    </div>
  );
};

export default App;