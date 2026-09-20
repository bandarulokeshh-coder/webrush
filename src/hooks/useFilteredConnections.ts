/**
 * Filters and connection detection derived from the loaded receipts.
 *
 * @module hooks/useFilteredConnections
 */

import { useMemo, useState } from 'react';
import type { ConnectionOptions, ConnectionType, Receipt, ReceiptType } from '../types/receipt';
import { RECEIPT_PAGE_SIZE } from '../constants/receipts';
import { countConnections, filterByDateRange, findAllConnections } from '../lib/connections';
import { receiptDisplayText } from '../lib/receiptText';

/** Every toggleable detector, in panel display order. */
export const CONNECTION_TOGGLES: readonly ConnectionType[] = [
  'temporal',
  'location',
  'location-name',
  'artist',
  'social',
  'chain',
] as const;

export interface FilterState {
  selectedType: ReceiptType | 'all';
  searchQuery: string;
  dateRange: { start: string; end: string } | null;
  timeDiffThreshold: number;
  enabledDetectors: Set<ConnectionType>;
  visibleCount: number;
}

/** Derives visible receipts, type counts and connection groups. */
export const useFilteredConnections = (receipts: Receipt[]) => {
  const [selectedType, setSelectedType] = useState<ReceiptType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [range, setRange] = useState<{ start: string; end: string } | null>(null);
  const [threshold, setThreshold] = useState(60 * 60 * 1000);
  const [enabled, setEnabled] = useState<Set<ConnectionType>>(() => new Set(CONNECTION_TOGGLES));
  const [visibleCount, setVisibleCount] = useState(RECEIPT_PAGE_SIZE * 5);

  const toggleDetector = (type: ConnectionType) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const loadMore = () => setVisibleCount((count) => count + RECEIPT_PAGE_SIZE);

  const filteredReceipts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let next = receipts;
    if (selectedType !== 'all') next = next.filter((r) => r.type === selectedType);
    if (range) next = filterByDateRange(next, range.start, range.end);
    if (query) next = next.filter((r) => receiptDisplayText(r).toLowerCase().includes(query));
    return [...next].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  }, [receipts, selectedType, searchQuery, range]);

  const connections = useMemo(() => {
    const options: ConnectionOptions = {
      temporalThresholdMs: threshold,
      includeTemporal: enabled.has('temporal'),
      includeLocation: enabled.has('location'),
      includeLocationName: enabled.has('location-name'),
      includeArtist: enabled.has('artist'),
      includeSocial: enabled.has('social'),
      includeChains: enabled.has('chain'),
    };
    return findAllConnections(filteredReceipts, options);
  }, [filteredReceipts, threshold, enabled]);

  const connectionCount = useMemo(() => countConnections(connections), [connections]);

  const typeCounts = useMemo(() => {
    const counts = new Map<ReceiptType, number>();
    for (const r of receipts) counts.set(r.type, (counts.get(r.type) ?? 0) + 1);
    return counts;
  }, [receipts]);

  const visibleReceipts = useMemo(
    () => filteredReceipts.slice(0, visibleCount),
    [filteredReceipts, visibleCount],
  );

  const filterState: FilterState = {
    selectedType,
    searchQuery,
    dateRange: range,
    timeDiffThreshold: threshold,
    enabledDetectors: enabled,
    visibleCount,
  };

  const pickType = (type: ReceiptType | 'all') => {
    setSelectedType(type);
    setVisibleCount(RECEIPT_PAGE_SIZE * 5);
  };

  const pickQuery = (query: string) => {
    setSearchQuery(query);
    setVisibleCount(RECEIPT_PAGE_SIZE * 5);
  };

  const pickRange = (next: { start: string; end: string } | null) => {
    setRange(next);
    setVisibleCount(RECEIPT_PAGE_SIZE * 5);
  };

  return {
    filterState,
    connections,
    connectionCount,
    typeCounts,
    filteredReceipts,
    visibleReceipts,
    setSelectedType: pickType,
    setSearchQuery: pickQuery,
    setDateRange: pickRange,
    setTimeDiffThreshold: setThreshold,
    toggleDetector,
    loadMore,
  };
};
