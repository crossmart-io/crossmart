import type { Redis } from 'ioredis';
import { RedisThrottlerStorage } from './redis-throttler.storage.js';

function storageAnswering(hits: number, remainingMs: number) {
  const evalScript = vi.fn().mockResolvedValue([hits, remainingMs]);
  return {
    storage: new RedisThrottlerStorage({ eval: evalScript } as unknown as Redis),
    evalScript,
  };
}

describe('RedisThrottlerStorage', () => {
  it('counts the hit in a Redis window that expires with the ttl', async () => {
    const { storage, evalScript } = storageAnswering(3, 42_100);

    const record = await storage.increment('key-1', 60_000, 10);

    expect(evalScript).toHaveBeenCalledWith(
      expect.stringContaining('INCR'),
      1,
      'crossmart:throttle:key-1',
      60_000,
    );
    expect(record).toEqual({
      totalHits: 3,
      timeToExpire: 43,
      isBlocked: false,
      timeToBlockExpire: 0,
    });
  });

  it('blocks past the limit until the window ends', async () => {
    const { storage } = storageAnswering(11, 5_000);

    expect(await storage.increment('key-1', 60_000, 10)).toEqual({
      totalHits: 11,
      timeToExpire: 5,
      isBlocked: true,
      timeToBlockExpire: 5,
    });
  });
});
