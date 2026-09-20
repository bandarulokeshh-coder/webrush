/**
 * Receipt grid with paginated rendering and an accessible detail dialog.
 *
 * @module components/ReceiptGrid
 */

import type React from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import type { Receipt } from '../types/receipt';
import ReceiptCard from './ReceiptCard';
import { formatTimestamp } from '../lib/format';
import { receiptDisplayText } from '../lib/receiptText';

interface ReceiptGridProps {
  visibleReceipts: Receipt[];
  filteredTotal: number;
  onLoadMore: () => void;
}

const ReceiptGrid: React.FC<ReceiptGridProps> = ({ visibleReceipts, filteredTotal, onLoadMore }) => {
  const [selected, setSelected] = useState<Receipt | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!selected) return;
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  return (
    <section aria-label="Receipt feed">
      {visibleReceipts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-medium text-gray-700 dark:text-slate-200">Nothing matches</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            Clear the search or widen the date range to see receipts again.
          </p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {visibleReceipts.map((receipt, index) => (
              <ReceiptCard
                key={receipt.id}
                receipt={receipt}
                index={index}
                onClick={() => setSelected(receipt)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {visibleReceipts.length < filteredTotal && (
        <div className="mt-6 text-center">
          <p className="mb-2 text-xs text-gray-500 dark:text-slate-400" role="status">
            Showing {visibleReceipts.length} of {filteredTotal}
          </p>
          <button
            type="button"
            onClick={onLoadMore}
            className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200 dark:hover:bg-indigo-500/20"
          >
            Load more
          </button>
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
            onClick={() => setSelected(null)}
          >
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl focus:outline-none dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium tracking-wide text-indigo-600 uppercase dark:text-indigo-300">
                    {selected.type} receipt
                  </p>
                  <h2 id={titleId} className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {receiptDisplayText(selected)}
                  </h2>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    {formatTimestamp(selected.timestamp)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Close receipt details"
                  autoFocus
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <dl className="mt-4 space-y-1.5 text-sm">
                <DetailRow label="ID" value={selected.id} />
                <DetailRow label="Type" value={selected.type} />
                <DetailRow label="Timestamp" value={selected.timestamp} />
              </dl>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex gap-2">
    <dt className="w-20 shrink-0 font-medium text-gray-500 dark:text-slate-400">{label}</dt>
    <dd className="break-all text-gray-800 dark:text-slate-100">{value}</dd>
  </div>
);

export default ReceiptGrid;
