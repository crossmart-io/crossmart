import { backoffDelayMs, retryAfterDelayMs, throttleDelayMs } from './shopify-retry-policy.js';

const cost = (requestedQueryCost: number, currentlyAvailable: number, restoreRate = 50) => ({
  requestedQueryCost,
  actualQueryCost: null,
  throttleStatus: { maximumAvailable: 1000, currentlyAvailable, restoreRate },
});

describe('Shopify retry policy', () => {
  it('backs off exponentially up to a cap', () => {
    expect([0, 1, 2, 3, 10].map((attempt) => backoffDelayMs(attempt))).toEqual([
      500, 1000, 2000, 4000, 10_000,
    ]);
  });

  it('waits exactly long enough for the bucket to cover the query', () => {
    expect(throttleDelayMs(cost(102, 2), 0)).toBe(2000);
    expect(throttleDelayMs(cost(10, 50), 0)).toBe(0);
    expect(throttleDelayMs(cost(100_000, 0), 0)).toBe(10_000);
    expect(throttleDelayMs(undefined, 1)).toBe(1000);
    expect(throttleDelayMs(cost(10, 0, 0), 2)).toBe(2000);
  });

  it('reads Retry-After seconds, falling back to backoff', () => {
    expect(retryAfterDelayMs({ 'retry-after': '2' }, 0)).toBe(2000);
    expect(retryAfterDelayMs({ 'retry-after': 'soon' }, 1)).toBe(1000);
    expect(retryAfterDelayMs({}, 0)).toBe(500);
  });
});
