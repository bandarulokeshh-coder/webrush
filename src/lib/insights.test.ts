/**
 * Unit tests for the insights engine.
 */
import { describe, expect, it } from 'vitest';
import type { Receipt } from '../types/receipt';
import { buildInsights, busiestHour, spendByCurrency, tallyBy } from './insights';

const purchase = (id: string, timestamp: string, price: number): Receipt => ({
  id,
  type: 'purchase',
  timestamp,
  item: 'Groceries',
  category: 'Food',
  price,
  currency: 'INR',
});

describe('tallyBy', () => {
  it('sorts by descending count', () => {
    const receipts: Receipt[] = [
      purchase('a', '2024-01-01T00:00:00Z', 10),
      purchase('b', '2024-01-01T00:00:00Z', 10),
    ];
    expect(tallyBy(receipts, (r) => (r.type === 'purchase' ? r.category : null))).toEqual([
      { label: 'Food', count: 2 },
    ]);
  });
});

describe('busiestHour', () => {
  it('returns null for an empty feed', () => {
    expect(busiestHour([])).toBeNull();
  });

  it('finds the modal hour', () => {
    const localIso = (hour: number, minute: number) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `2024-01-01T${pad(hour)}:${pad(minute)}:00`;
    };
    const receipts: Receipt[] = [
      purchase('a', localIso(10, 15), 10),
      purchase('b', localIso(10, 45), 10),
      purchase('c', localIso(22, 0), 10),
    ];
    const result = busiestHour(receipts);
    expect(result?.count).toBe(2);
    expect(result?.hour).toBe(new Date(localIso(10, 15)).getHours());
  });
});

describe('spendByCurrency', () => {
  it('groups totals per currency', () => {
    const receipts: Receipt[] = [
      purchase('a', '2024-01-01T00:00:00Z', 10),
      purchase('b', '2024-01-01T00:00:00Z', 20),
    ];
    expect(spendByCurrency(receipts)).toEqual([{ currency: 'INR', total: 30 }]);
  });
});

describe('buildInsights', () => {
  it('returns empty for an empty feed', () => {
    expect(buildInsights([])).toEqual([]);
  });

  it('frames the feed with a span insight', () => {
    const insights = buildInsights(
      [purchase('a', '2024-01-01T00:00:00Z', 10), purchase('b', '2024-01-10T00:00:00Z', 10)],
      4,
    );
    expect(insights[0].id).toBe('span');
    expect(insights.some((i) => i.id === 'density')).toBe(true);
  });
});
