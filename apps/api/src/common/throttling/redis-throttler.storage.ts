import type { ThrottlerStorage } from '@nestjs/throttler';
import type { Redis } from 'ioredis';
import { MS_PER_SECOND, THROTTLE_KEY_PREFIX } from './throttling.constants.js';

/** What `ThrottlerStorage` reports for one hit; times are in seconds. */
interface ThrottlerRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

/**
 * Counts a hit and starts the window on the first one, atomically. Returns the hits so far and
 * the milliseconds left in the window.
 */
const INCREMENT_SCRIPT = `
local hits = redis.call('INCR', KEYS[1])
if hits == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
return { hits, redis.call('PTTL', KEYS[1]) }
`;
const ONE_KEY = 1;
const NOT_BLOCKED = 0;

/**
 * Rate-limit windows in Redis, so every API instance shares them (the throttler's default
 * storage is per process). Fixed windows: a caller over the limit waits until the window ends,
 * which is when `Retry-After` points. `@nest-lab/throttler-storage-redis` would do the same but
 * does not support NestJS 12 yet, and this is all of it.
 */
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redis: Redis) {}

  async increment(key: string, ttl: number, limit: number): Promise<ThrottlerRecord> {
    const [totalHits, remainingMs] = (await this.redis.eval(
      INCREMENT_SCRIPT,
      ONE_KEY,
      `${THROTTLE_KEY_PREFIX}${key}`,
      ttl,
    )) as [number, number];
    const timeToExpire = Math.max(1, Math.ceil(remainingMs / MS_PER_SECOND));
    const isBlocked = totalHits > limit;
    return {
      totalHits,
      timeToExpire,
      isBlocked,
      timeToBlockExpire: isBlocked ? timeToExpire : NOT_BLOCKED,
    };
  }
}
