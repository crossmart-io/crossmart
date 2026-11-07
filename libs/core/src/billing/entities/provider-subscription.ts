import type { BillingInterval, SubscriptionStatus } from '@crossmart/database';

/** A subscription as the billing provider holds it, in Crossmart's terms. */
export interface ProviderSubscription {
  id: string;
  customerId: string;
  /** From the subscription's metadata, set at checkout; null when it was made elsewhere. */
  organizationId: string | null;
  status: SubscriptionStatus;
  /** The lookup keys of its prices: a plan's, and later any add-on's. */
  priceLookupKeys: string[];
  /** The plan price's interval; null when no price is recurring. */
  interval: BillingInterval | null;
  currentPeriodEnd: Date | null;
  trialEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}
