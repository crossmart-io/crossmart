import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ASK_QUOTA_KEY_TTL_SECONDS } from '../ask.constants.js';
import { AskQuota } from './ask-quota.js';

/** Counts one use and starts the key's lifetime on the first one, atomically. */
const TAKE_SCRIPT = `
local taken = redis.call('INCR', KEYS[1])
if taken == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return taken
`;
const ONE_KEY = 1;
const ISO_DATE_LENGTH = 10;
const KEY_SEPARATOR = ':';

/** A daily count in Redis per key and UTC date: `<prefix><key>:2026-11-07`. */
@Injectable()
export class RedisAskQuota extends AskQuota {
  constructor(private readonly redis: Redis) {
    super();
  }

  async tryTake(keyPrefix: string, key: string, cap: number, now: Date): Promise<boolean> {
    const day = now.toISOString().slice(0, ISO_DATE_LENGTH);
    const taken = (await this.redis.eval(
      TAKE_SCRIPT,
      ONE_KEY,
      `${keyPrefix}${key}${KEY_SEPARATOR}${day}`,
      ASK_QUOTA_KEY_TTL_SECONDS,
    )) as number;
    return taken <= cap;
  }
}
