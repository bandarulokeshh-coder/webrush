import React, { useState, useEffect } from 'react';
import ReceiptCard from './components/ReceiptCard';
import {
  Receipt,
  groupByType,
  sortByTimestamp,
  findTemporalConnections,
  findLocationConnections
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
  const [connections, setConnections] = useState<Array<{receipt1: Receipt; receipt2: Receipt; timeDiffMs: number}>>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [timeDiffThreshold, setTimeDiffThreshold] = useState<number>(3600000); // 1 hour in ms

  // Initialize with mock data
  useEffect(() => {
    const mockData = generateMockData();
    setReceipts(mockData);
    setFilteredReceipts(mockData);

    // Calculate initial connections
    const temporalConnections = findTemporalConnections(mockData, timeDiffThreshold);
    setConnections(temporalConnections);
  }, [timeDiffThreshold]);

  // Filter receipts by type
  useEffect(() => {
    if (selectedType === 'all') {
      setFilteredReceipts(receipts);
    } else {
      setFilteredReceipts(receipts.filter(r => r.type === selectedType));
    }
  }, [receipts, selectedType]);

  // Recalculate connections when threshold changes
  useEffect(() => {
    if (receipts.length > 0) {
      const temporalConnections = findTemporalConnections(receipts, timeDiffThreshold);
      setConnections(temporalConnections);
    }
  }, [receipts, timeDiffThreshold]);

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
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Total Receipts:</p>
                <p className="font-medium text-gray-800">{receipts.length}</p>
              </div>
              <div>
                <p className="text-gray-500">Filtered View:</p>
                <p className="font-medium text-gray-800">{filteredReceipts.length}</p>
              </div>
              <div>
                <p className="text-gray-500">Temporal Connections:</p>
                <p className="font-medium text-gray-800">{connections.length}</p>
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
              Moments that happened close in time (within {Math.round(timeDiffThreshold / 60000)} minutes) may be related
            </p>

            {connections.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No connections found with current threshold.</p>
            ) : (
              <div className="space-y-3">
                {connections.slice(0, 8).map((conn, index) => (
                  <div key={index} className="border-l-4 border-indigo-200 pl-3 py-2 bg-indigo-50">
                    <div className="flex items-start space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-indigo-600">
                        🔗
                      </div>
                      <div className="flex-1 space-y-1 text-sm">
                        <div className="flex justify-between text-gray-700">
                          <span>{conn.receipt1.type === conn.receipt2.type ?
                            `${conn.receipt1.type}` :
                            `${conn.receipt1.type} → ${conn.receipt2.type}`}
                          </span>
                          <span className="text-gray-500">
                            {Math.round(conn.timeDiffMs / 60000)} min apart
                          </span>
                        </div>
                        <div className="text-gray-600">
                          <span className="font-medium">{conn.receipt1.type === 'music' ?
                            (conn.receipt1 as MusicReceipt).track :
                            conn.receipt1.type === 'movie' ?
                            (conn.receipt1 as MovieReceipt).title :
                            conn.receipt1.type === 'place' ?
                            (conn.receipt1 as PlaceReceipt).name :
                            conn.receipt1.type === 'purchase' ?
                            (conn.receipt1 as PurchaseReceipt).item :
                            conn.receipt1.type === 'photo' ?
                            (conn.receipt1 as PhotoReceipt).caption || 'Photo' :
                            conn.receipt1.type === 'message' ?
                            (conn.receipt1 as MessageReceipt).sender :
                            conn.receipt1.type === 'search' ?
                            `(search) "${(conn.receipt1 as SearchReceipt).query}"` :
                            conn.receipt1.type === 'event' ?
                            (conn.receipt1 as EventReceipt).title :
                            (conn.receipt1 as NoteReceipt).content.substring(0, 20) + '...'
                          }</span>
                          {' → '}
                          <span className="font-medium">{conn.receipt2.type === 'music' ?
                            (conn.receipt2 as MusicReceipt).track :
                            conn.receipt2.type === 'movie' ?
                            (conn.receipt2 as MovieReceipt).title :
                            conn.receipt2.type === 'place' ?
                            (conn.receipt2 as PlaceReceipt).name :
                            conn.receipt2.type === 'purchase' ?
                            (conn.receipt2 as PurchaseReceipt).item :
                            conn.receipt2.type === 'photo' ?
                            (conn.receipt2 as PhotoReceipt).caption || 'Photo' :
                            conn.receipt2.type === 'message' ?
                            (conn.receipt2 as MessageReceipt).sender :
                            conn.receipt2.type === 'search' ?
                            `(search) "${(conn.receipt2 as SearchReceipt).query}"` :
                            conn.receipt2.type === 'event' ?
                            (conn.receipt2 as EventReceipt).title :
                            (conn.receipt2 as NoteReceipt).content.substring(0, 20) + '...'
                          }</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {connections.length > 8 && (
                  <p className="text-center text-sm text-gray-500 mt-3">
                    and {connections.length - 8} more connections...
                  </p>
                )}
              </div>
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