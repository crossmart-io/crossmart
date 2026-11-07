import { SubscriptionStatus } from '@crossmart/database';
import { Feature } from '../enums/feature.enum.js';
import type {
  SubscriptionRecord,
  SubscriptionRepository,
} from '../repositories/subscription.repository.js';
import type { EntitlementEnforcement } from './entitlement-enforcement.js';
import { OrganizationPlanService } from './organization-plan.service.js';

function record(): SubscriptionRecord {
  return {
    id: 'sub-1',
    organizationId: 'org-1',
    planVersionId: 'pv-growth-2',
    status: SubscriptionStatus.ACTIVE,
    currentPeriodEnd: null,
    externalCustomerId: null,
    externalSubscriptionId: null,
    billingInterval: null,
    trialEnd: null,
    cancelAtPeriodEnd: false,
    cancelAt: null,
    pastDueSince: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    planVersion: {
      version: 2,
      plan: { code: 'growth', name: 'Growth', active: true },
      features: [{ feature: Feature.ActiveListings, enabled: true, limit: 10_000 }],
    },
  };
}

function setup(
  subscribed: boolean,
  defaultVersion: string | null = 'pv-starter-2',
  billingEnabled = false,
) {
  const subscriptions = {
    findForOrganization: vi
      .fn<SubscriptionRepository['findForOrganization']>()
      .mockResolvedValue(subscribed ? record() : null),
    findDefaultPlanVersionId: vi
      .fn<SubscriptionRepository['findDefaultPlanVersionId']>()
      .mockResolvedValue(defaultVersion),
    subscribe: vi.fn<SubscriptionRepository['subscribe']>().mockResolvedValue(record()),
  };
  const enforcement = { billingEnabled } as EntitlementEnforcement;
  const service = new OrganizationPlanService(
    subscriptions as unknown as SubscriptionRepository,
    enforcement,
  );
  return { service, subscriptions };
}

describe('OrganizationPlanService', () => {
  it('reads the plan version the organization is on', async () => {
    const { service, subscriptions } = setup(true);
    const snapshot = await service.current('org-1');
    expect(snapshot.plan).toEqual({
      code: 'growth',
      name: 'Growth',
      version: 2,
      offered: true,
    });
    expect(snapshot.grants.get(Feature.ActiveListings)?.limit).toBe(10_000);
    expect(subscriptions.subscribe).not.toHaveBeenCalled();
  });

  it('says when the plan is a legacy one that is no longer offered', async () => {
    const { service, subscriptions } = setup(true);
    const legacy = record();
    legacy.planVersion.plan.active = false;
    subscriptions.findForOrganization.mockResolvedValueOnce(legacy);
    expect((await service.current('org-1')).plan.offered).toBe(false);
  });

  it('puts an organization without a subscription on the default plan', async () => {
    const { service, subscriptions } = setup(false);
    await service.current('org-1');
    expect(subscriptions.subscribe).toHaveBeenCalledWith('org-1', 'pv-starter-2');
  });

  it('starts new organizations active with billing off, and incomplete until checkout with it on', async () => {
    await expect(setup(false).service.startingSubscription()).resolves.toEqual({
      planVersionId: 'pv-starter-2',
      status: SubscriptionStatus.ACTIVE,
    });
    await expect(
      setup(false, 'pv-starter-2', true).service.startingSubscription(),
    ).resolves.toEqual({ planVersionId: 'pv-starter-2', status: SubscriptionStatus.INCOMPLETE });
  });

  it('fails loudly when no default plan was seeded', async () => {
    const { service } = setup(false, null);
    await expect(service.defaultPlanVersionId()).rejects.toThrow(/No default plan/);
  });
});
