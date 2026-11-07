import type { AppConfigService } from '@crossmart/common';
import { BillingInterval, SubscriptionStatus } from '@crossmart/database';
import { SubscriptionAccessState } from '../../entitlements/enums/subscription-access-state.enum.js';
import type { SubscriptionAccessPolicy } from '../../entitlements/services/subscription-access-policy.js';
import type { OrganizationPlanService } from '../../entitlements/services/organization-plan.service.js';
import { planSnapshot, TEST_PLAN } from '../../entitlements/testing/entitlement.fixtures.js';
import type {
  BillingAccountRecord,
  BillingAccountRepository,
} from '../repositories/billing-account.repository.js';
import { BillingStatusService } from './billing-status.service.js';

const TRIAL_END = new Date('2026-11-14T00:00:00.000Z');
const ACCOUNT: BillingAccountRecord = {
  organizationId: 'org-1',
  status: SubscriptionStatus.TRIALING,
  externalCustomerId: 'cus_1',
  externalSubscriptionId: 'sub_1',
  billingInterval: BillingInterval.ANNUAL,
  currentPeriodEnd: TRIAL_END,
  trialEnd: TRIAL_END,
  cancelAtPeriodEnd: false,
  pastDueSince: null,
  planVersionId: 'pv-starter-2',
  planVersion: { plan: { code: 'starter' } },
  organization: { name: 'Ana Ceramics' },
};

it('BillingStatusService reports the plan, the provider’s view and what the organization may do', async () => {
  const access = { state: SubscriptionAccessState.Trialing, writable: true, until: TRIAL_END };
  const service = new BillingStatusService(
    {
      findByOrganization: vi.fn().mockResolvedValue(ACCOUNT),
    } as unknown as BillingAccountRepository,
    {
      current: vi.fn().mockResolvedValue(planSnapshot([])),
    } as unknown as OrganizationPlanService,
    {
      access: vi.fn().mockResolvedValue(access),
      enforced: true,
    } as unknown as SubscriptionAccessPolicy,
    { billingEnabled: true } as AppConfigService,
  );

  expect(await service.status('org-1')).toEqual({
    organizationId: 'org-1',
    enabled: true,
    enforced: true,
    plan: TEST_PLAN,
    status: SubscriptionStatus.TRIALING,
    interval: BillingInterval.ANNUAL,
    currentPeriodEnd: TRIAL_END,
    trialEnd: TRIAL_END,
    cancelAtPeriodEnd: false,
    access,
    hasBillingAccount: true,
    trialAvailable: false,
  });
});
