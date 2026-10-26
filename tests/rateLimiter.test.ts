import { describe, it, expect } from 'vitest';
import { AirtableRateLimiter } from '../src/cli/utils/rateLimiter.js';

describe('AirtableRateLimiter', () => {
  it('executes tasks within rate limits', async () => {
    const limiter = new AirtableRateLimiter({ maxRequestsPerSecond: 10 });
    let counter = 0;

    const promises = Array.from({ length: 5 }, () =>
      limiter.execute(async () => {
        counter++;
        return counter;
      })
    );

    const results = await Promise.all(promises);
    expect(results).toHaveLength(5);
    expect(counter).toBe(5);
  });
});
