import type { BillingInterval, SubscriptionStatus } from '@crossmart/database';

/** What a provider subscription changes on the organization's subscription row. */
export interface SubscriptionUpdate {
  planVersionId: string;
  status: SubscriptionStatus;
  externalCustomerId: string;
  externalSubscriptionId: string;
  billingInterval: BillingInterval | null;
  currentPeriodEnd: Date | null;
  trialEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: Date | null;
  pastDueSince: Date | null;
}

/** The provider ids a webhook may name an organization by. */
export interface ProviderReference {
  subscriptionId: string | null;
  customerId: string | null;
}
