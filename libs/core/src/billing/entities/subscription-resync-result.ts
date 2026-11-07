import type { SubscriptionResyncOutcome } from '../enums/subscription-resync-outcome.enum.js';

/** The result of resyncing one organization's subscription from the billing provider. */
export interface SubscriptionResyncResult {
  organizationId: string;
  outcome: SubscriptionResyncOutcome;
  /** The provider subscription that was read; null when there was none. */
  subscriptionId: string | null;
}
