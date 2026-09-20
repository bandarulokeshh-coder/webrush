/**
 * Unit tests for mock-data generation — verifies determinism.
 */
import { describe, expect, it } from 'vitest';
import { createRandom } from './mockData';

describe('createRandom (mulberry32)', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRandom(42);
    const b = createRandom(42);
    const seqA = Array.from({ length: 5 }, () => a());
    const seqB = Array.from({ length: 5 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('differs for different seeds', () => {
    const a = createRandom(42);
    const b = createRandom(99);
    expect(a()).not.toBe(b());
  });

  it('stays within [0, 1)', () => {
    const random = createRandom(123);
    for (let i = 0; i < 1000; i++) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
