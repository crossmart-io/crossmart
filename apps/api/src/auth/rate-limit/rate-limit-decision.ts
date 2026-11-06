import type { BetterAuthRateLimitStorage } from 'better-auth';

/** A rate-limit window and the most requests it allows, as Better Auth passes them (seconds). */
export type RateLimitRule = Parameters<BetterAuthRateLimitStorage['consume']>[1];
/** Whether one request may go ahead, and if not, in how many seconds to retry. */
export type RateLimitDecision = Awaited<ReturnType<BetterAuthRateLimitStorage['consume']>>;

export const MS_PER_SECOND = 1000;

/** A request within the limit. */
export const ALLOWED: RateLimitDecision = { allowed: true, retryAfter: null };

/** The decision for a window that has counted `hits` and ends in `remainingMs`. */
export function decide(hits: number, rule: RateLimitRule, remainingMs: number): RateLimitDecision {
  if (hits <= rule.max) return ALLOWED;
  return { allowed: false, retryAfter: Math.max(1, Math.ceil(remainingMs / MS_PER_SECOND)) };
}
