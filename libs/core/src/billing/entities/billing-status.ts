import type { BillingInterval, SubscriptionStatus } from '@crossmart/database';
import type { PlanReference } from '../../entitlements/entities/plan-snapshot.js';
import type { SubscriptionAccess } from '../../entitlements/entities/subscription-access.js';

/** An organization's subscription as its billing page shows it. */
export interface BillingStatus {
  organizationId: string;
  /** Whether this instance bills customers at all; false when self-hosting. */
  enabled: boolean;
  /** Whether a read-only organization is refused writes (billing and enforcement are on). */
  enforced: boolean;
  plan: PlanReference;
  status: SubscriptionStatus;
  interval: BillingInterval | null;
  currentPeriodEnd: Date | null;
  trialEnd: Date | null;
  /** A cancellation is scheduled; kept for clients that predate `cancelAt`. */
  cancelAtPeriodEnd: boolean;
  /** When a scheduled cancellation ends the subscription; null when it renews. */
  cancelAt: Date | null;
  access: SubscriptionAccess;
  /** Whether it has a customer at the provider, so the billing portal can open. */
  hasBillingAccount: boolean;
  /** Whether a checkout now would start with a free trial. */
  trialAvailable: boolean;
}
