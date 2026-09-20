import type React from 'react';

/**
 * Page header: product name, dataset pill selector and theme toggle.
 *
 * @module components/AppHeader
 */

import type { DatasetId } from '../types/receipt';
import { APP_NAME, APP_TAGLINE, DATASET_SOURCES } from '../constants/receipts';
import type { DatasetLoadState } from '../hooks/useReceipts';
import ThemeToggle from './ThemeToggle';
import { cn } from '../lib/utils';

interface AppHeaderProps {
  dataSource: DatasetId;
  onSelectSource: (source: DatasetId) => void;
  loadState: Record<DatasetId, DatasetLoadState>;
}

const AppHeader: React.FC<AppHeaderProps> = ({ dataSource, onSelectSource, loadState }) => (
  <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
        {APP_NAME}{' '}
        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
          — {APP_TAGLINE}
        </span>
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600 sm:text-base dark:text-slate-400">
        Every moment becomes an itemised receipt. Receipts close in time, place, people or
        sequence become linked — a paper trail of your life.
      </p>
    </div>
    <div className="flex items-center gap-2">
      <div
        role="tablist"
        aria-label="Data source"
        className="flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        {DATASET_SOURCES.map((source) => {
          const state = loadState[source.id];
          const isActive = dataSource === source.id;
          return (
            <button
              key={source.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              title={source.description}
              onClick={() => onSelectSource(source.id)}
              className={cn(
                'relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500',
                isActive
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
              )}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 shadow" />
              )}
              <span className="relative">
                {source.label}
                {state.status === 'loading' && '…'}
              </span>
            </button>
          );
        })}
      </div>
      <ThemeToggle />
    </div>
  </header>
);

export default AppHeader;
