import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Clock, Network, Database, Sparkles, AlertCircle, Loader2, MapPin, Music, Users, Link2, type LucideIcon } from 'lucide-react';
import ReceiptCard from './components/ReceiptCard';
import ThemeToggle from './components/ThemeToggle';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/Card';
import { Badge } from './components/ui/Badge';
import { cn } from './lib/utils';
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
} from './utils/data';
import { findAllConnections } from './utils/data';
import {
  loadSpotifyData,
  loadTransactionData,
  loadIndiaTransactData
} from './utils/dataLoader';
import './App.css';

// Max number of receipt cards rendered at once - keeps large datasets smooth
const MAX_VISIBLE_RECEIPTS = 250;

// Icon + label used for each connection type across the dashboard
const CONNECTION_ICONS: Record<string, LucideIcon> = {
  temporal: Clock,
  location: MapPin,
  artist: Music,
  'location-name': MapPin,
  social: Users,
  chain: Link2
};

const CONNECTION_LABELS: Record<string, string> = {
  temporal: 'Temporal',
  location: 'Location-based',
  artist: 'Artist/Mentions',
  'location-name': 'Location Names',
  social: 'Social Connections',
  chain: 'Activity Chains'
};

const StatTile: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
    <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-slate-400">{label}</p>
    <p className="mt-1 text-lg font-semibold text-gray-900 tabular-nums dark:text-white">{value}</p>
  </div>
);

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
      tags: [['idea', 'reminder', 'recipe', 'workout', 'read-later'][Math.floor(Math.random() * 5)]]
    });
  }

  return receipts;
};

const App: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [timeDiffThreshold, setTimeDiffThreshold] = useState<number>(3600000); // 1 hour in ms
  const [selectedConnectionTypes, setSelectedConnectionTypes] = useState<Set<string>>(new Set(['temporal']));
  const [dataSource, setDataSource] = useState<'mock' | 'spotify' | 'transactions' | 'india'>('mock');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load data based on dataSource
  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);
      let loadedReceipts: Receipt[] = [];

      try {
        switch (dataSource) {
          case 'mock':
            loadedReceipts = generateMockData();
            break;
          case 'spotify':
            const spotifyResponse = await fetch('/datasets/spotify_sample.csv');
            if (!spotifyResponse.ok) throw new Error('Failed to load Spotify sample');
            const spotifyText = await spotifyResponse.text();
            const musicReceipts = loadSpotifyData(spotifyText);
            loadedReceipts = musicReceipts.map(mr => ({ ...mr }) as Receipt);
            break;
          case 'transactions':
            const txnResponse = await fetch('/datasets/transactions_sample.csv');
            if (!txnResponse.ok) throw new Error('Failed to load transactions sample');
            const txnText = await txnResponse.text();
            const purchaseReceipts = loadTransactionData(txnText);
            loadedReceipts = purchaseReceipts.map(pr => ({ ...pr }) as Receipt);
            break;
          case 'india':
            const indiaResponse = await fetch('/datasets/india_transact_sample.csv');
            if (!indiaResponse.ok) throw new Error('Failed to load India Transact sample');
            const indiaText = await indiaResponse.text();
            const { purchases, places } = loadIndiaTransactData(indiaText);
            loadedReceipts = [...purchases.map(p => ({ ...p }) as Receipt), ...places.map(pl => ({ ...pl }) as Receipt)];
            break;
        }

        if (!isCancelled) {
          setReceipts(loadedReceipts);
        }
      } catch (error) {
        if (!isCancelled) {
          setLoadError(error instanceof Error ? error.message : 'Unknown error');
          console.error('Data loading error:', error);
          // Fallback to mock data on error
          setReceipts(generateMockData());
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [dataSource]);

  // Derived during render (no effect needed): receipts visible under the type filter
  const filteredReceipts = useMemo(
    () => (selectedType === 'all' ? receipts : receipts.filter(r => r.type === selectedType)),
    [receipts, selectedType]
  );

  // Derived during render: connections recomputed when the data or tuning knobs change
  const allConnections = useMemo(
    () =>
      findAllConnections(receipts, {
        temporalThresholdMs: timeDiffThreshold,
        includeLocation: selectedConnectionTypes.has('location'),
        includeArtist: selectedConnectionTypes.has('artist'),
        includeSocial: selectedConnectionTypes.has('social'),
        includeChains: selectedConnectionTypes.has('chain')
      }),
    [receipts, timeDiffThreshold, selectedConnectionTypes]
  );

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
        return (receipt as NoteReceipt).content.length > 30
          ? (receipt as NoteReceipt).content.substring(0, 30) + '...'
          : (receipt as NoteReceipt).content;
      default:
        return (receipt as Receipt).type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 transition-colors dark:from-slate-950 dark:to-slate-900">
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-3 flex items-center gap-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
                <Sparkles className="h-5 w-5" />
              </span>
              Your Life, In Receipts
            </h1>
            <p className="max-w-2xl text-lg text-gray-600 dark:text-slate-400">
              Explore the connections in your digital life - transform disconnected moments into meaningful stories
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Data Source Controls */}
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
              <Database className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
              Data Source:
            </span>
            <div className="flex flex-wrap gap-2">
              {([
                { value: 'mock', label: 'Mock Data' },
                { value: 'spotify', label: 'Spotify Sample' },
                { value: 'transactions', label: 'Transactions Sample' },
                { value: 'india', label: 'India Transact Sample' }
              ] as const).map(option => {
                const isActive = dataSource === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => setDataSource(option.value)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
                      isActive
                        ? 'border-transparent bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-500/60 dark:hover:text-indigo-300'
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>


          {/* Loading Status */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-300"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading data...</span>
            </motion.div>
          )}

          {/* Error Message */}
          {loadError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{loadError}</span>
            </motion.div>
          )}
        </div>
      </header>

      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-start gap-4">
            <div className="min-w-[200px] flex-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Filter by Type:
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                {typeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[200px] flex-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Connection Sensitivity (time threshold):
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="300000"
                  max="7200000"
                  step="300000"
                  value={timeDiffThreshold}
                  onChange={(e) => setTimeDiffThreshold(Number(e.target.value))}
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-indigo-600 dark:bg-slate-700"
                />
                <span className="inline-flex min-w-[64px] justify-center rounded-md bg-indigo-50 px-2 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                  {Math.round(timeDiffThreshold / 60000)} min
                </span>
              </div>
            </div>

            <div className="mt-4 min-w-[200px] flex-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Connection Types:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: 'temporal', label: 'Temporal (time)' },
                  { key: 'location', label: 'Location' },
                  { key: 'artist', label: 'Artist/Mention' },
                  { key: 'social', label: 'Social (People)' },
                  { key: 'chain', label: 'Activity Chains' }
                ] as const).map(option => {
                  const checked = selectedConnectionTypes.has(option.key);
                  return (
                    <button
                      key={option.key}
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => {
                        const newSet = new Set(selectedConnectionTypes);
                        if (newSet.has(option.key)) {
                          newSet.delete(option.key);
                        } else {
                          newSet.add(option.key);
                        }
                        setSelectedConnectionTypes(newSet);
                      }}
                      className="flex items-center gap-2 text-left"
                    >
                      <span
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                          checked
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-gray-300 bg-white dark:border-slate-600 dark:bg-slate-900'
                        )}
                      >
                        {checked && (
                          <svg viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-current stroke-[2.5]">
                            <path d="M2.5 6.5 5 9l4.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-slate-300">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {/* Stats Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="mb-4">Overview</CardTitle>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatTile label="Total Receipts" value={receipts.length} />
              <StatTile label="Filtered View" value={filteredReceipts.length} />
              <StatTile
                label="Date Range"
                value={
                  receipts.length > 0 ? (
                    <>
                      {new Date(Math.min(...receipts.map(r => new Date(r.timestamp).getTime()))).toLocaleDateString()}
                      {' – '}
                      {new Date(Math.max(...receipts.map(r => new Date(r.timestamp).getTime()))).toLocaleDateString()}
                    </>
                  ) : (
                    'No data'
                  )
                }
              />
            </div>

            <div className="mt-5 space-y-1">
              <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-slate-100">
                <Network className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                Connections Found
              </h3>
              {allConnections.map(connType => {
                const count = connType.data.length || (connType.data.receipts ? 1 : 0);
                const Icon = CONNECTION_ICONS[connType.type] ?? Network;
                return (
                  <div key={connType.type} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                      <Icon className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                      {CONNECTION_LABELS[connType.type] || connType.type}
                    </span>
                    <span className="font-semibold text-gray-800 tabular-nums dark:text-slate-100">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardHeader>
        </Card>

        {/* Receipts Grid */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="mb-4">
              {selectedType === 'all' ? 'All Receipts' : `${typeOptions.find(o => o.value === selectedType)?.label} Receipts`}
            </CardTitle>

            {filteredReceipts.length === 0 ? (
              <p className="py-8 text-center text-gray-500 dark:text-slate-400">No receipts match the current filters.</p>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredReceipts.slice(0, MAX_VISIBLE_RECEIPTS).map((receipt, index) => (
                    <ReceiptCard
                      key={receipt.id}
                      receipt={receipt}
                      index={index}
                    />
                  ))}
                </div>
                {filteredReceipts.length > MAX_VISIBLE_RECEIPTS && (
                  <p className="mt-4 text-center text-sm text-gray-500 dark:text-slate-400">
                    Showing first {MAX_VISIBLE_RECEIPTS} of {filteredReceipts.length} receipts in this dataset
                  </p>
                )}
              </>
            )}
          </CardHeader>
        </Card>

        {/* Connections Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="mb-2">Discovered Connections</CardTitle>
            <CardDescription className="mb-4">
              Explore different types of connections in your digital life
            </CardDescription>

            {allConnections.length === 0 ? (
              <p className="py-8 text-center text-gray-500 dark:text-slate-400">No connections found with current filters.</p>
            ) : (
              <>
                {/* Connection type summary */}
                <div className="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-slate-950/40">
                  <div className="flex flex-wrap gap-2">
                    {allConnections.map(connType => {
                      const count = connType.data.length || (connType.data.receipts ? 1 : 0);
                      const Icon = CONNECTION_ICONS[connType.type] ?? Network;
                      const isSelected = selectedConnectionTypes.has(connType.type);
                      return (
                        <Badge key={connType.type} variant={isSelected ? 'default' : 'secondary'}>
                          <Icon className="h-3 w-3" />
                          {CONNECTION_LABELS[connType.type] || connType.type}: {count}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Detailed connections */}
                <div className="space-y-4">
                  {allConnections.map((connType, typeIndex) => {
                    // Skip if not selected
                    if (!selectedConnectionTypes.has(connType.type)) return null;

                    const titles: Record<string, string> = {
                      temporal: 'Temporal Connections',
                      location: 'Location-Based Connections',
                      artist: 'Artist & Mention Connections',
                      'location-name': 'Location Name Matches',
                      social: 'Social Connections (People)',
                      chain: 'Activity Chains'
                    };

                    const title = titles[connType.type] || connType.type;
                    const Icon = CONNECTION_ICONS[connType.type] ?? Link2;

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
                        <div key={typeIndex} className="rounded-lg border-l-4 border-indigo-300 py-2 pl-3 dark:border-indigo-500/60">
                          <div className="mb-2 flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <h3 className="font-medium text-gray-800 dark:text-slate-100">{title}</h3>
                              <p className="text-sm text-gray-600 dark:text-slate-400">
                                Found {chains.length} activity chains representing potential experiences
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {chains.slice(0, 3).map((chain, chainIndex) => (
                              <div key={chainIndex} className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-500/10">
                                <div className="text-sm font-medium text-gray-800 dark:text-slate-100">
                                  {chain.description}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-slate-400">
                                  {new Date(chain.startTime).toLocaleTimeString()} → {new Date(chain.endTime).toLocaleTimeString()}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {chain.receipts.map((receipt, rIndex) => (
                                    <Badge key={rIndex} variant="secondary">
                                      {receipt.type}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ))}
                            {chains.length > 3 && (
                              <p className="mt-2 text-center text-sm text-gray-500 dark:text-slate-400">
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
                      <div key={typeIndex} className="rounded-lg border-l-4 border-indigo-300 py-2 pl-3 dark:border-indigo-500/60">
                        <div className="mb-2 flex items-start gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <h3 className="font-medium text-gray-800 dark:text-slate-100">{title}</h3>
                            <p className="text-sm text-gray-600 dark:text-slate-400">
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
                              <motion.div
                                key={connIndex}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: connIndex * 0.05 }}
                                className="rounded-lg bg-indigo-50 p-2 transition-colors hover:bg-indigo-100/70 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-300">
                                    <Link2 className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 space-y-1 text-sm">
                                    <div className="flex justify-between text-gray-700 dark:text-slate-200">
                                      <span>
                                        {receipt1.type === receipt2.type ?
                                          `${receipt1.type}` :
                                          `${receipt1.type} → ${receipt2.type}`}
                                      </span>
                                      <span className="text-gray-500 dark:text-slate-400">
                                        {connectionInfo}
                                      </span>
                                    </div>
                                    <div className="text-gray-600 dark:text-slate-400">
                                      <span className="font-medium text-gray-800 dark:text-slate-100">{getReceiptDisplayText(receipt1)}</span>
                                      {' → '}
                                      <span className="font-medium text-gray-800 dark:text-slate-100">{getReceiptDisplayText(receipt2)}</span>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                          {connectionsArray.length > 3 && (
                            <p className="mt-2 text-center text-sm text-gray-500 dark:text-slate-400">
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
          </CardHeader>
        </Card>
      </div>

      <footer className="mt-8 text-center text-sm text-gray-500 dark:text-slate-500">
        Built for WebRush Hackathon • Frontend-only solution •{' '}
        <a href="#" className="text-indigo-600 hover:underline dark:text-indigo-400">
          View on GitHub
        </a>
      </footer>
    </div>
  );
};

export default App;