import { SubscriptionStatus } from '@crossmart/database';
import type { BillingAccountRecord } from '../repositories/billing-account.repository.js';

/** An organization's billing row before it ever checked out, with `overrides` applied. */
export function billingAccount(
  overrides: Partial<BillingAccountRecord> = {},
): BillingAccountRecord {
  return {
    organizationId: 'org-1',
    status: SubscriptionStatus.INCOMPLETE,
    externalCustomerId: null,
    externalSubscriptionId: null,
    billingInterval: null,
    currentPeriodEnd: null,
    trialEnd: null,
    cancelAtPeriodEnd: false,
    pastDueSince: null,
    planVersionId: 'pv-starter-2',
    planVersion: { plan: { code: 'starter' } },
    organization: { name: 'Ana Ceramics' },
    ...overrides,
  };
}
