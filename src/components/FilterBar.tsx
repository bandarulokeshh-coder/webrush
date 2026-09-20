/**
 * Type pills, search box and date-range inputs above the receipt grid.
 *
 * @module components/FilterBar
 */

import type React from 'react';
import { Search } from 'lucide-react';
import type { ReceiptType } from '../types/receipt';
import { RECEIPT_TYPES } from '../types/receipt';
import { RECEIPT_VISUALS } from '../constants/receipts';
import { formatCompactNumber } from '../lib/format';
import { cn } from '../lib/utils';

interface FilterBarProps {
  selectedType: ReceiptType | 'all';
  onSelectType: (type: ReceiptType | 'all') => void;
  searchQuery: string;
  onSearchQuery: (query: string) => void;
  dateRange: { start: string; end: string } | null;
  onDateRange: (range: { start: string; end: string } | null) => void;
  typeCounts: Map<ReceiptType, number>;
  minDate: string;
  maxDate: string;
}

const FilterBar: React.FC<FilterBarProps> = ({
  selectedType,
  onSelectType,
  searchQuery,
  onSearchQuery,
  dateRange,
  onDateRange,
  typeCounts,
  minDate,
  maxDate,
}) => (
  <div className="space-y-3">
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
        aria-hidden="true"
      />
      <input
        type="search"
        value={searchQuery}
        onChange={(event) => onSearchQuery(event.target.value)}
        placeholder="Search receipts — artist, place, merchant…"
        aria-label="Search receipts"
        className="w-full rounded-xl border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      />
    </div>

    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div
        role="group"
        aria-label="Filter by receipt type"
        className="flex flex-wrap gap-1.5"
      >
        <FilterPill
          active={selectedType === 'all'}
          onClick={() => onSelectType('all')}
          label="All"
        />
        {RECEIPT_TYPES.map((type) => {
          const { Icon } = RECEIPT_VISUALS[type];
          const count = typeCounts.get(type) ?? 0;
          if (count === 0) return null;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelectType(selectedType === type ? 'all' : type)}
              aria-pressed={selectedType === type}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500',
                selectedType === type
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {type}
              <span className="tabular-nums opacity-70">{formatCompactNumber(count)}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-slate-300">
        <label className="flex items-center gap-1.5">
          <span>From</span>
          <input
            type="date"
            aria-label="Start date"
            min={minDate}
            max={maxDate}
            value={dateRange?.start ?? ''}
            onChange={(event) =>
              onDateRange({ start: event.target.value, end: dateRange?.end ?? maxDate })
            }
            className="rounded-lg border border-gray-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
        <label className="flex items-center gap-1.5">
          <span>To</span>
          <input
            type="date"
            aria-label="End date"
            min={minDate}
            max={maxDate}
            value={dateRange?.end ?? ''}
            onChange={(event) =>
              onDateRange({ start: dateRange?.start ?? minDate, end: event.target.value })
            }
            className="rounded-lg border border-gray-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
        {dateRange && (
          <button
            type="button"
            onClick={() => onDateRange(null)}
            className="rounded-lg px-2 py-1 font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  </div>
);

const FilterPill: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({
  active,
  onClick,
  label,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500',
      active
        ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
    )}
  >
    {label}
  </button>
);

export default FilterBar;
