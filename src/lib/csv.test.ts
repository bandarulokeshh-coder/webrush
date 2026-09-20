/**
 * Unit tests for the pure CSV parsers — no DOM, no network.
 */
import { describe, expect, it } from 'vitest';
import {
  parseCsvLine,
  parseIndiaTransactCsv,
  parseSpotifyCsv,
  parseTransactionsCsv,
  splitCsvRows,
  toIsoFromDayFirst,
  toIsoFromMonthFirst,
} from '../lib/csv';

describe('parseCsvLine', () => {
  it('respects quoted commas', () => {
    expect(parseCsvLine('a,"Say It, Just Say It",b')).toEqual(['a', 'Say It, Just Say It', 'b']);
  });

  it('unescapes doubled quotes', () => {
    expect(parseCsvLine('"a ""quoted"" b",c')).toEqual(['a "quoted" b', 'c']);
  });
});

describe('splitCsvRows', () => {
  it('skips the header and handles CRLF', () => {
    expect(splitCsvRows('h1,h2\r\n1,2\r\n3,4\r\n')).toEqual(['1,2', '3,4']);
  });

  it('returns empty for header-only input', () => {
    expect(splitCsvRows('h1,h2')).toEqual([]);
  });
});

describe('parseSpotifyCsv', () => {
  const csv = [
    'uri,ts,user,ms,track,artist,album,a,b',
    'spotify:1,2013-07-08 02:44:34,u,180000,Track A,Artist A,Album A,x,y',
    'spotify:1,2013-07-08 03:00:00,u,0,Track A,Artist A,Album A,x,y',
  ].join('\n');

  it('produces one receipt per play with unique ids', () => {
    const receipts = parseSpotifyCsv(csv);
    expect(receipts).toHaveLength(2);
    expect(receipts[0].id).not.toBe(receipts[1].id);
    expect(receipts[0].duration).toBe(180);
    expect(receipts[1].duration).toBe(180);
  });
});

describe('parseTransactionsCsv', () => {
  const csv = [
    'Date,Mode,Category,Subcategory,Note,Amount,Income/Expense,Currency',
    '20/09/2018 12:04:08,Cash,Food,Groceries,Weekly shop,250.5,Expense,INR',
    '21/09/2018 09:00:00,Salary,Income,Pay,Monthly,50000,Income,INR',
  ].join('\n');

  it('keeps expenses only', () => {
    const receipts = parseTransactionsCsv(csv);
    expect(receipts).toHaveLength(1);
    expect(receipts[0].price).toBe(250.5);
    expect(receipts[0].currency).toBe('INR');
  });
});

describe('parseIndiaTransactCsv', () => {
  it('returns empty for a header with no rows', () => {
    expect(parseIndiaTransactCsv('a,b,c')).toEqual({ purchases: [], places: [] });
  });
});

describe('date helpers', () => {
  it('converts day-first timestamps', () => {
    expect(toIsoFromDayFirst('20/09/2018 12:04:08')).toBe('2018-09-20T12:04:08:00.000Z');
  });

  it('converts month-first timestamps', () => {
    expect(toIsoFromMonthFirst('12/26/2023 0:55')).toBe('2023-12-26T00:55:00.000Z');
  });

  it('rejects malformed input', () => {
    expect(toIsoFromDayFirst('not-a-date')).toBeNull();
    expect(toIsoFromMonthFirst('12/26/2023')).toBeNull();
  });
});
