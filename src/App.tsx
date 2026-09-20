/**
 * WebRush — Your Life, In Receipts. (Code-split shell.)
 */

import type React from 'react';
import { Suspense, lazy, useMemo, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { DatasetId } from './types/receipt';
import { DATASET_SOURCES, GITHUB_URL } from './constants/receipts';
import { useReceipts } from './hooks/useReceipts';
import { useFilteredConnections } from './hooks/useFilteredConnections';
import { buildInsights } from './lib/insights';
import { formatDate } from './lib/format';
import AppHeader from './components/AppHeader';
import FilterBar from './components/FilterBar';
import ReceiptSkeletonGrid from './components/ReceiptSkeleton';
import ErrorBoundary from './components/ErrorBoundary';
import ConnectionControls from './components/ConnectionControls';
import { InsightList, StatsStrip } from './components/InsightsPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/Card';

// Below-the-fold panels load on demand so the first paint is only the feed.
const ReceiptGrid = lazy(() => import('./components/ReceiptGrid'));
const ConnectionsPanel = lazy(() => import('./components/ConnectionsPanel'));


const App: React.FC = () => {
  const [dataSource, setDataSource] = useState<DatasetId>('mock');
  const { receipts, loadState, isLoading, loadError, retry } = useReceipts(dataSource);
  const {
    filterState, connections, connectionCount, typeCounts,
    filteredReceipts, visibleReceipts,
    setSelectedType, setSearchQuery, setDateRange,
    setTimeDiffThreshold, toggleDetector, loadMore,
  } = useFilteredConnections(receipts);

  const activeSource = DATASET_SOURCES.find((s) => s.id === dataSource);

  const dateBounds = useMemo(() => {
    let min = '';
    let max = '';
    for (const r of receipts) {
      const day = r.timestamp.slice(0, 10);
      if (!day) continue;
      if (!min || day < min) min = day;
      if (!max || day > max) max = day;
    }
    return { min, max };
  }, [receipts]);

  const insights = useMemo(
    () => buildInsights(filteredReceipts, connectionCount),
    [filteredReceipts, connectionCount],
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <a
        href="#receipt-feed"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-indigo-600 focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to receipts
      </a>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <AppHeader dataSource={dataSource} onSelectSource={setDataSource} loadState={loadState} />
        <StatsStrip
          total={receipts.length}
          shown={visibleReceipts.length}
          connections={connectionCount}
          filtered={filteredReceipts.length}
        />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <main id="receipt-feed" className="min-w-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Receipt feed</CardTitle>
                <CardDescription>
                  {activeSource?.description ?? 'Browse every moment as an itemised receipt.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FilterBar
                  selectedType={filterState.selectedType}
                  onSelectType={setSelectedType}
                  searchQuery={filterState.searchQuery}
                  onSearchQuery={setSearchQuery}
                  dateRange={filterState.dateRange}
                  onDateRange={setDateRange}
                  typeCounts={typeCounts}
                  minDate={dateBounds.min}
                  maxDate={dateBounds.max}
                />
              </CardContent>
            </Card>
            {isLoading && <ReceiptSkeletonGrid />}
            {!isLoading && loadError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-500/30 dark:bg-red-500/10"
              >
                <AlertCircle className="mx-auto h-6 w-6 text-red-500" aria-hidden="true" />
                <p className="mt-2 text-sm font-medium text-red-700 dark:text-red-300">
                  Could not load {activeSource?.label ?? 'dataset'}
                </p>
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{loadError}</p>
                <button
                  type="button"
                  onClick={retry}
                  className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            )}


            {!isLoading && !loadError && (
              <ErrorBoundary label="Receipt feed">
                <Suspense fallback={<ReceiptSkeletonGrid />}>
                  <ReceiptGrid
                    visibleReceipts={visibleReceipts}
                    filteredTotal={filteredReceipts.length}
                    onLoadMore={loadMore}
                  />
                </Suspense>
              </ErrorBoundary>
            )}
            {!isLoading && !loadError && (
              <Card>
                <CardHeader>
                  <CardTitle>Connections</CardTitle>
                  <CardDescription>
                    {connectionCount > 0
                      ? `${connectionCount} links across the filtered feed.`
                      : 'Links hiding between receipts will appear here.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ErrorBoundary label="Connections panel">
                    <Suspense fallback={<ReceiptSkeletonGrid />}>
                      <ConnectionsPanel connections={connections} />
                    </Suspense>
                  </ErrorBoundary>
                </CardContent>
              </Card>
            )}
          </main>
          <aside className="min-w-0 space-y-4">
            <ConnectionControls
              timeDiffThreshold={filterState.timeDiffThreshold}
              onThreshold={setTimeDiffThreshold}
              enabledDetectors={filterState.enabledDetectors}
              onToggleDetector={toggleDetector}
            />
            {!isLoading && !loadError && <InsightList insights={insights} />}
            {isLoading && (
              <Card>
                <CardContent className="flex items-center gap-2 pt-4 text-sm text-gray-500 dark:text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Loading {activeSource?.label ?? 'dataset'}…
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
        <footer className="mt-8 text-center text-sm text-gray-500 dark:text-slate-500">
          Built for WebRush Hackathon · Frontend-only ·{' '}
          <a
            href={GITHUB_URL}
            className="text-indigo-600 hover:underline dark:text-indigo-400"
            target="_blank"
            rel="noreferrer"
          >
            View on GitHub
          </a>
          <span className="mt-1 block text-xs">
            {filteredReceipts.length > 0 && (
              <>
                {formatDate(filteredReceipts[filteredReceipts.length - 1].timestamp)} →{' '}
                {formatDate(filteredReceipts[0].timestamp)}
              </>
            )}
          </span>
        </footer>
      </div>
    </div>
  );
};

export default App;
