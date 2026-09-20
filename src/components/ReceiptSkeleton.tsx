import type React from 'react';

/**
 * Skeleton placeholder shown while a dataset loads.
 *
 * Twelve pulsing tiles mirror the receipt-grid layout so the page does not
 * jump when real cards arrive (reduces layout shift on slow networks).
 */
const ReceiptSkeletonGrid: React.FC = () => (
  <div
    aria-hidden="true"
    className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  >
    {Array.from({ length: 12 }).map((_, index) => (
      <div
        key={index}
        className="animate-pulse rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/70"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-slate-800" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-slate-800" />
            <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-slate-800/60" />
          </div>
        </div>
        <div className="mt-4 space-y-2 border-t border-gray-50 pt-3 dark:border-slate-800/60">
          <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-slate-800" />
          <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-slate-800/60" />
        </div>
      </div>
    ))}
  </div>
);

export default ReceiptSkeletonGrid;