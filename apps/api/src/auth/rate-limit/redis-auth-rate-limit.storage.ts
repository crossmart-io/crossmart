import { Injectable, Logger } from '@nestjs/common';
import type { BetterAuthRateLimitStorage } from 'better-auth';
import { Redis } from 'ioredis';
import { describeError, withTimeout } from '@crossmart/common';
import {
  AUTH_RATE_LIMIT_FAIL_CLOSED_PATHS,
  AUTH_RATE_LIMIT_KEY_PREFIX,
  AUTH_RATE_LIMIT_KEY_SEPARATOR,
  AUTH_RATE_LIMIT_LOCAL_MAX_WINDOWS,
  AUTH_RATE_LIMIT_REDIS_TIMEOUT_MS,
  AUTH_RATE_LIMIT_UNAVAILABLE_RETRY_AFTER_SECONDS,
} from '../auth.constants.js';
import { LocalRateLimitWindows } from './local-rate-limit-windows.js';
import {
  decide,
  MS_PER_SECOND,
  type RateLimitDecision,
  type RateLimitRule,
} from './rate-limit-decision.js';

/**
 * Counts a request and starts the window on the first one, atomically. Returns the requests so
 * far and the milliseconds left in the window.
 */
const INCREMENT_SCRIPT = `
local hits = redis.call('INCR', KEYS[1])
if hits == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
return { hits, redis.call('PTTL', KEYS[1]) }
`;
const ONE_KEY = 1;
/** ioredis's status once the connection can take commands. */
const REDIS_READY = 'ready';

/** The connection is closed or still connecting, so a command would wait in ioredis's queue. */
class RedisNotReadyError extends Error {
  override readonly name = 'RedisNotReadyError';
  readonly code: string;

  constructor(status: string) {
    super(`Redis connection is ${status}`);
    this.code = status;
  }
}

const REFUSED_WHILE_UNAVAILABLE: RateLimitDecision = {
  allowed: false,
  retryAfter: AUTH_RATE_LIMIT_UNAVAILABLE_RETRY_AFTER_SECONDS,
};

/** The path in a Better Auth rate-limit key (`<ip>|<path>`). */
function pathOf(key: string): string {
  return key.slice(key.indexOf(AUTH_RATE_LIMIT_KEY_SEPARATOR) + 1);
}

/**
 * Better Auth's rate limits (sign-in, OAuth authorize, token and registration, and its other
 * rules) in Redis, so every API instance shares the windows and they survive a deploy. Better
 * Auth builds each key from the client IP, which it reads from `CLIENT_IP_HEADERS` as Ask does.
 *
 * When Redis is down or slow, registration fails closed (refused, see
 * `AUTH_RATE_LIMIT_FAIL_CLOSED_PATHS`) and every other path falls back to per-instance windows,
 * so people and agents can still sign in and refresh tokens (ADR 0019).
 */
@Injectable()
export class RedisAuthRateLimitStorage implements BetterAuthRateLimitStorage {
  private readonly logger = new Logger(RedisAuthRateLimitStorage.name);
  private readonly fallback = new LocalRateLimitWindows(AUTH_RATE_LIMIT_LOCAL_MAX_WINDOWS);
  private degraded = false;

  constructor(private readonly redis: Redis) {}

  async consume(key: string, rule: RateLimitRule): Promise<RateLimitDecision> {
    try {
      const decision = await this.consumeInRedis(key, rule);
      this.markHealthy();
      return decision;
    } catch (error) {
      this.markDegraded(error);
      return this.consumeWithoutRedis(key, rule);
    }
  }

  private async consumeInRedis(key: string, rule: RateLimitRule): Promise<RateLimitDecision> {
    if (this.redis.status !== REDIS_READY) {
      throw new RedisNotReadyError(this.redis.status);
    }
    const reply = this.redis.eval(
      INCREMENT_SCRIPT,
      ONE_KEY,
      `${AUTH_RATE_LIMIT_KEY_PREFIX}${key}`,
      rule.window * MS_PER_SECOND,
    ) as Promise<[number, number]>;
    const [hits, remainingMs] = await withTimeout(reply, AUTH_RATE_LIMIT_REDIS_TIMEOUT_MS);
    return decide(hits, rule, remainingMs);
  }

  private consumeWithoutRedis(key: string, rule: RateLimitRule): RateLimitDecision {
    if (AUTH_RATE_LIMIT_FAIL_CLOSED_PATHS.includes(pathOf(key))) return REFUSED_WHILE_UNAVAILABLE;
    return this.fallback.consume(key, rule);
  }

  /** Logged once per outage, without the key: it holds the caller's IP address. */
  private markDegraded(error: unknown): void {
    if (this.degraded) return;
    this.degraded = true;
    this.logger.warn(
      `Auth rate limits cannot reach Redis (${describeError(error)}); counting per instance ` +
        'and refusing client registration until it is back',
    );
  }

  private markHealthy(): void {
    if (!this.degraded) return;
    this.degraded = false;
    this.logger.log('Auth rate limits are shared in Redis again');
  }
}
