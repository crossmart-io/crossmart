import { RateLimitScope } from '@crossmart/connectors';
import { ConnectionRateLimiter } from './connection-rate-limiter.js';

const STORE_BUCKET = {
  name: 'graphql',
  scope: RateLimitScope.Connection,
  capacity: 100,
  restorePerSecond: 50,
};
const APP_BUCKET = { name: 'app', scope: RateLimitScope.App, capacity: 30, restorePerSecond: 10 };

describe('ConnectionRateLimiter', () => {
  it('lets calls through while the bucket holds their cost, then says how long to wait', () => {
    const limiter = new ConnectionRateLimiter();

    expect(limiter.reserve('c1', [STORE_BUCKET], 60, 0)).toBe(0);
    expect(limiter.reserve('c1', [STORE_BUCKET], 60, 0)).toBe(400);
    // Half a second later 25 points came back: 40 + 25 = 65 is enough.
    expect(limiter.reserve('c1', [STORE_BUCKET], 60, 500)).toBe(0);
  });

  it('keeps one bucket per connection, but one per app for app-wide limits', () => {
    const limiter = new ConnectionRateLimiter();

    expect(limiter.reserve('c1', [STORE_BUCKET, APP_BUCKET], 20, 0)).toBe(0);
    expect(limiter.reserve('c2', [STORE_BUCKET, APP_BUCKET], 20, 0)).toBe(1000);
    expect(limiter.reserve('c2', [STORE_BUCKET], 20, 0)).toBe(0);
  });

  it('never makes a call wait forever for more than the bucket can hold', () => {
    const limiter = new ConnectionRateLimiter();

    expect(limiter.reserve('c1', [APP_BUCKET], 500, 0)).toBe(0);
    expect(limiter.reserve('c1', [], 500, 0)).toBe(0);
  });
});
