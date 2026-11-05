import type { Redis } from 'ioredis';
import { RedisReplayGuard } from './redis-replay.guard.js';

describe('RedisReplayGuard', () => {
  function guardAnswering(reply: 'OK' | null) {
    const set = vi.fn().mockResolvedValue(reply);
    return { guard: new RedisReplayGuard({ set } as unknown as Redis), set };
  }

  it('claims a key with an atomic SET NX and a millisecond expiry', async () => {
    const { guard, set } = guardAnswering('OK');

    expect(await guard.claim('oauth:abc', 1500.2)).toBe(true);
    expect(set).toHaveBeenCalledWith('crossmart:replay:oauth:abc', '1', 'PX', 1501, 'NX');
  });

  it('refuses a key that is already claimed', async () => {
    expect(await guardAnswering(null).guard.claim('oauth:abc', 1000)).toBe(false);
  });

  it('never sends an expiry below one millisecond', async () => {
    const { guard, set } = guardAnswering('OK');

    await guard.claim('late', -20);

    expect(set).toHaveBeenCalledWith('crossmart:replay:late', '1', 'PX', 1, 'NX');
  });
});
