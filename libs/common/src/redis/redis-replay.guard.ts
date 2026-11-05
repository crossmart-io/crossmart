import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REPLAY_KEY_PREFIX, REPLAY_MARKER } from './redis.constants.js';
import { ReplayGuard } from './replay-guard.js';

const SET_IF_ABSENT = 'NX';
const EXPIRY_IN_MILLISECONDS = 'PX';
const SET_SUCCEEDED = 'OK';
/** Redis refuses an expiry below one millisecond. */
const MIN_TTL_MS = 1;

/** `ReplayGuard` on Redis: an atomic `SET key 1 NX PX ttl`, so concurrent claims cannot both win. */
@Injectable()
export class RedisReplayGuard extends ReplayGuard {
  constructor(private readonly redis: Redis) {
    super();
  }

  async claim(key: string, ttlMs: number): Promise<boolean> {
    const result = await this.redis.set(
      `${REPLAY_KEY_PREFIX}${key}`,
      REPLAY_MARKER,
      EXPIRY_IN_MILLISECONDS,
      Math.max(MIN_TTL_MS, Math.ceil(ttlMs)),
      SET_IF_ABSENT,
    );
    return result === SET_SUCCEEDED;
  }
}
