/**
 * Shared data-loading state for the receipt pipeline.
 *
 * Extracted from `App.tsx` so the fetch/parse effect, the memoized filters
 * and the connection detection can each be reasoned about (and tested) in
 * isolation instead of living inside one 800-line component.
 *
 * @module hooks/useReceipts
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DatasetId, Receipt } from '../types/receipt';
import { DATASET_SOURCES } from '../constants/receipts';
import { generateMockData } from '../lib/mockData';
import {
  parseSpotifyCsv,
  parseTransactionsCsv,
  parseIndiaTransactCsv,
} from '../lib/csv';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Runtime snapshot of one dataset load. */
export interface DatasetLoadState {
  status: LoadStatus;
  count: number;
  error?: string;
}

/** Initial per-dataset state before anything has loaded. */
const initialState = (): Record<DatasetId, DatasetLoadState> => ({
  mock: { status: 'idle', count: 0 },
  spotify: { status: 'idle', count: 0 },
  transactions: { status: 'idle', count: 0 },
  indiaTransact: { status: 'idle', count: 0 },
});

/** In-memory cache of parsed receipts per dataset (module scope = app lifetime). */
const datasetCache = new Map<DatasetId, Receipt[]>();

/**
 * Loads the active dataset exactly once per source change.
 *
 * Mock data is generated synchronously (seeded, so it is stable across
 * reloads); CSV sources are fetched from `public/datasets/` and parsed with
 * the pure parsers in `lib/csv.ts`. A cancellation flag guards against
 * setting state after the user switches source mid-fetch.
 *
 * @param dataSource - Which dataset is currently selected.
 * @returns The receipts, per-dataset status, error and a retry trigger.
 */
export const useReceipts = (dataSource: DatasetId) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loadState, setLoadState] = useState<Record<DatasetId, DatasetLoadState>>(initialState);
  const [retryToken, setRetryToken] = useState(0);

  /** Forces the current source to reload (used by the error-state retry button). */
  const retry = useCallback(() => setRetryToken((token) => token + 1), []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadState((prev) => ({
        ...prev,
        [dataSource]: { status: 'loading', count: 0 },
      }));

      try {
        let next: Receipt[];

        if (dataSource === 'mock') {
          next = generateMockData();
        } else {
          const source = DATASET_SOURCES.find((entry) => entry.id === dataSource);
          if (!source?.path) throw new Error(`Unknown dataset "${dataSource}"`);

          // Cache parsed receipts in memory so switching back to a dataset
          // never re-downloads or re-parses the CSV.
          const cached = datasetCache.get(dataSource);
          if (cached) {
            next = cached;
          } else {
            const response = await fetch(source.path);
            if (!response.ok) throw new Error(`Failed to fetch (${response.status})`);

            const csvText = await response.text();
            if (dataSource === 'spotify') next = parseSpotifyCsv(csvText);
            else if (dataSource === 'transactions') next = parseTransactionsCsv(csvText);
            else {
              const { purchases, places } = parseIndiaTransactCsv(csvText);
              next = [...purchases, ...places];
            }
            datasetCache.set(dataSource, next);
          }
        }

        if (cancelled) return;
        setReceipts(next);
        setLoadState((prev) => ({
          ...prev,
          [dataSource]: { status: 'ready', count: next.length },
        }));
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Failed to load dataset';
        setReceipts([]);
        setLoadState((prev) => ({
          ...prev,
          [dataSource]: { status: 'error', count: 0, error: message },
        }));
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [dataSource, retryToken]);

  return useMemo(
    () => ({
      receipts,
      loadState,
      isLoading: loadState[dataSource].status === 'loading',
      loadError: loadState[dataSource].error ?? null,
      retry,
    }),
    [receipts, loadState, dataSource, retry],
  );
};
