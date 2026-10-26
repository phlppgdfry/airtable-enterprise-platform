import { describe, it, expect } from 'vitest';
import { AirtableBatchEngine } from '../src/client/batchUpsert.js';

describe('AirtableBatchEngine', () => {
  it('correctly chunks records into maximum 10 items per batch', () => {
    const records = Array.from({ length: 25 }, (_, i) => ({ id: `rec${i}`, fields: { name: `Item ${i}` } }));
    const chunks = AirtableBatchEngine.chunk(records, 10);

    expect(chunks.length).toBe(3);
    expect(chunks[0].length).toBe(10);
    expect(chunks[1].length).toBe(10);
    expect(chunks[2].length).toBe(5);
  });

  it('handles empty arrays without errors', () => {
    const chunks = AirtableBatchEngine.chunk([], 10);
    expect(chunks).toEqual([]);
  });

  it('handles items count smaller than batch size', () => {
    const records = [{ id: 'rec1', fields: {} }, { id: 'rec2', fields: {} }];
    const chunks = AirtableBatchEngine.chunk(records, 10);
    expect(chunks.length).toBe(1);
    expect(chunks[0].length).toBe(2);
  });
});
