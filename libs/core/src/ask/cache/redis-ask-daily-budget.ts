import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ASK_BUDGET_KEY_PREFIX, ASK_BUDGET_KEY_TTL_SECONDS } from '../ask.constants.js';
import { AskDailyBudget } from './ask-daily-budget.js';

/** Counts a question and starts the key's lifetime on the first one, atomically. */
const TAKE_SCRIPT = `
local taken = redis.call('INCR', KEYS[1])
if taken == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return taken
`;
const ONE_KEY = 1;
const ISO_DATE_LENGTH = 10;

/** The day's count in Redis, one key per UTC date: `crossmart:ask:questions:2026-11-06`. */
@Injectable()
export class RedisAskDailyBudget extends AskDailyBudget {
  constructor(private readonly redis: Redis) {
    super();
  }

  async tryTake(cap: number, now: Date): Promise<boolean> {
    const key = `${ASK_BUDGET_KEY_PREFIX}${now.toISOString().slice(0, ISO_DATE_LENGTH)}`;
    const taken = (await this.redis.eval(
      TAKE_SCRIPT,
      ONE_KEY,
      key,
      ASK_BUDGET_KEY_TTL_SECONDS,
    )) as number;
    return taken <= cap;
  }
}
