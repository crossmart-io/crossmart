import { Injectable } from '@nestjs/common';
import { type RateLimitBucket, RateLimitScope } from '@crossmart/connectors';
import { MILLISECONDS_PER_SECOND, RATE_LIMIT_KEY_SEPARATOR } from './sync.constants.js';

interface BucketState {
  available: number;
  updatedAt: number;
}

/**
 * Paces channel calls with the leaky buckets each connector declares: one bucket per
 * connection (a Shopify store) or per app. `reserve` takes the cost when the bucket holds it,
 * and otherwise says how long to wait. It is per worker process; the connector still handles
 * the channel's own throttling replies, so several workers stay correct, only less smooth.
 */
@Injectable()
export class ConnectionRateLimiter {
  private readonly states = new Map<string, BucketState>();

  /** Milliseconds to wait before the call may run; 0 when it may run now (and was counted). */
  reserve(
    connectionId: string,
    buckets: readonly RateLimitBucket[],
    cost: number,
    now = Date.now(),
  ): number {
    const waits = buckets.map((bucket) =>
      this.waitFor(this.keyOf(connectionId, bucket), bucket, cost, now),
    );
    const wait = Math.max(0, ...waits);
    if (wait === 0) {
      for (const bucket of buckets) {
        this.take(this.keyOf(connectionId, bucket), cost);
      }
    }
    return wait;
  }

  private keyOf(connectionId: string, bucket: RateLimitBucket): string {
    return bucket.scope === RateLimitScope.Connection
      ? [bucket.name, connectionId].join(RATE_LIMIT_KEY_SEPARATOR)
      : bucket.name;
  }

  private waitFor(key: string, bucket: RateLimitBucket, cost: number, now: number): number {
    const state = this.refill(key, bucket, now);
    const needed = Math.min(cost, bucket.capacity) - state.available;
    return needed <= 0
      ? 0
      : Math.ceil((needed / bucket.restorePerSecond) * MILLISECONDS_PER_SECOND);
  }

  private refill(key: string, bucket: RateLimitBucket, now: number): BucketState {
    const state = this.states.get(key) ?? { available: bucket.capacity, updatedAt: now };
    const elapsedSeconds = Math.max(now - state.updatedAt, 0) / MILLISECONDS_PER_SECOND;
    const refilled = {
      available: Math.min(
        bucket.capacity,
        state.available + elapsedSeconds * bucket.restorePerSecond,
      ),
      updatedAt: now,
    };
    this.states.set(key, refilled);
    return refilled;
  }

  private take(key: string, cost: number): void {
    const state = this.states.get(key);
    if (state) {
      state.available = Math.max(state.available - cost, 0);
    }
  }
}
