import type { SubscriptionStatus } from '@crossmart/database';

/**
 * The subscription a new organization starts with: the default plan's latest version, and
 * `ACTIVE` with billing off or `INCOMPLETE` until it checks out with billing on (ADR 0024).
 */
export interface StartingSubscription {
  planVersionId: string;
  status: SubscriptionStatus;
}
