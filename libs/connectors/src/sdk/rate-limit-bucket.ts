/** How a channel meters calls. Costs are requests, or query cost points for GraphQL APIs. */
export enum RateLimitScope {
  /** One bucket per connected account (a Shopify store). */
  Connection = 'connection',
  /** One bucket for the whole app, shared by every account. */
  App = 'app',
}

/**
 * A leaky bucket a connector declares, so the worker can size its per-connection BullMQ
 * limiters: `capacity` units, refilled at `restorePerSecond`.
 */
export interface RateLimitBucket {
  name: string;
  scope: RateLimitScope;
  capacity: number;
  restorePerSecond: number;
}
