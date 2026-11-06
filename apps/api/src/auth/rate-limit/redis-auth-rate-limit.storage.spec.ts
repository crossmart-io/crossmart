import type { Redis } from 'ioredis';
import { RedisAuthRateLimitStorage } from './redis-auth-rate-limit.storage.js';

const SIGN_IN_KEY = '203.0.113.7|/sign-in/email';
const REGISTER_KEY = '203.0.113.7|/oauth2/register';
const RULE = { window: 60, max: 3 };

function storageWith(evalScript: ReturnType<typeof vi.fn>, status = 'ready') {
  const redis = { status, eval: evalScript } as unknown as Redis;
  return new RedisAuthRateLimitStorage(redis);
}

describe('RedisAuthRateLimitStorage', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts the request in a Redis window keyed by client IP and path', async () => {
    const evalScript = vi.fn().mockResolvedValue([2, 41_000]);

    const decision = await storageWith(evalScript).consume(SIGN_IN_KEY, RULE);

    expect(decision).toEqual({ allowed: true, retryAfter: null });
    expect(evalScript).toHaveBeenCalledWith(
      expect.stringContaining('INCR'),
      1,
      'crossmart:auth-rate-limit:203.0.113.7|/sign-in/email',
      60_000,
    );
  });

  it('refuses past the limit until the window ends', async () => {
    const evalScript = vi.fn().mockResolvedValue([4, 12_300]);

    await expect(storageWith(evalScript).consume(SIGN_IN_KEY, RULE)).resolves.toEqual({
      allowed: false,
      retryAfter: 13,
    });
  });

  describe('when Redis is unavailable', () => {
    const failing = () => vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    it('keeps sign-in and tokens working, limited per instance', async () => {
      const storage = storageWith(failing());

      const decisions = [];
      for (let attempt = 0; attempt <= RULE.max; attempt += 1) {
        decisions.push(await storage.consume(SIGN_IN_KEY, RULE));
      }

      expect(decisions.slice(0, RULE.max).every((decision) => decision.allowed)).toBe(true);
      expect(decisions[RULE.max]?.allowed).toBe(false);
    });

    it('refuses client registration', async () => {
      await expect(storageWith(failing()).consume(REGISTER_KEY, RULE)).resolves.toEqual({
        allowed: false,
        retryAfter: 60,
      });
    });

    it('does not wait for a connection that is not ready', async () => {
      const evalScript = vi.fn();

      const decision = await storageWith(evalScript, 'reconnecting').consume(SIGN_IN_KEY, RULE);

      expect(decision.allowed).toBe(true);
      expect(evalScript).not.toHaveBeenCalled();
    });

    it('stops waiting for a slow Redis', async () => {
      vi.useFakeTimers();
      const storage = storageWith(vi.fn().mockReturnValue(new Promise(() => undefined)));

      const pending = storage.consume(REGISTER_KEY, RULE);
      await vi.advanceTimersByTimeAsync(250);

      await expect(pending).resolves.toMatchObject({ allowed: false });
    });
  });
});
