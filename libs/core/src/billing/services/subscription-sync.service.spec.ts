import { BillingInterval, SubscriptionStatus } from '@crossmart/database';
import type {
  BillingAccountRecord,
  BillingAccountRepository,
} from '../repositories/billing-account.repository.js';
import { billingAccount } from '../testing/billing-account.fixtures.js';
import { fakeSubscription } from '../testing/fake-billing-provider.js';
import { SubscriptionSyncService } from './subscription-sync.service.js';

function account(overrides: Partial<BillingAccountRecord> = {}): BillingAccountRecord {
  return billingAccount({ externalCustomerId: 'cus_fake', ...overrides });
}

function setup(current: BillingAccountRecord = account()) {
  const accounts = {
    findByOrganization: vi
      .fn<BillingAccountRepository['findByOrganization']>()
      .mockResolvedValue(current),
    findOrganizationId: vi
      .fn<BillingAccountRepository['findOrganizationId']>()
      .mockResolvedValue('org-1'),
    findLatestPlanVersionId: vi
      .fn<BillingAccountRepository['findLatestPlanVersionId']>()
      .mockResolvedValue('pv-growth-2'),
    applySubscription: vi.fn<BillingAccountRepository['applySubscription']>().mockResolvedValue(),
  };
  const service = new SubscriptionSyncService(accounts as unknown as BillingAccountRepository);
  return { service, accounts };
}

describe('SubscriptionSyncService', () => {
  it('records a new trial and keeps the plan version of the same plan', async () => {
    const { service, accounts } = setup();
    const trialEnd = new Date('2026-11-14T00:00:00.000Z');

    await service.apply(
      fakeSubscription({ organizationId: 'org-1', status: SubscriptionStatus.TRIALING, trialEnd }),
      null,
    );

    expect(accounts.findLatestPlanVersionId).not.toHaveBeenCalled();
    expect(accounts.applySubscription).toHaveBeenCalledWith('org-1', {
      planVersionId: 'pv-starter-2',
      status: SubscriptionStatus.TRIALING,
      externalCustomerId: 'cus_fake',
      externalSubscriptionId: 'sub_fake',
      billingInterval: BillingInterval.MONTHLY,
      currentPeriodEnd: new Date('2026-12-07T00:00:00.000Z'),
      trialEnd,
      cancelAtPeriodEnd: false,
      cancelAt: null,
      pastDueSince: null,
    });
  });

  it('records a cancellation scheduled for the trial end, and clears it when undone', async () => {
    const trialEnd = new Date('2026-11-14T00:00:00.000Z');
    const { service, accounts } = setup(account({ externalSubscriptionId: 'sub_fake' }));
    const trialing = { status: SubscriptionStatus.TRIALING, trialEnd };

    await service.apply(
      fakeSubscription({ ...trialing, cancelAtPeriodEnd: true, cancelAt: trialEnd }),
      'org-1',
    );
    await service.apply(fakeSubscription(trialing), 'org-1');

    const updates = accounts.applySubscription.mock.calls.map(([, update]) => update);
    expect(updates[0]).toMatchObject({ cancelAtPeriodEnd: true, cancelAt: trialEnd });
    expect(updates[1]).toMatchObject({ cancelAtPeriodEnd: false, cancelAt: null });
  });

  it('moves the organization to the latest version of the plan its price names', async () => {
    const { service, accounts } = setup(account({ externalSubscriptionId: 'sub_fake' }));

    await service.apply(
      fakeSubscription({ priceLookupKeys: ['crossmart_growth_annual'] }),
      'org-1',
    );

    expect(accounts.findLatestPlanVersionId).toHaveBeenCalledWith('growth');
    expect(accounts.applySubscription.mock.calls[0]?.[1]).toMatchObject({
      planVersionId: 'pv-growth-2',
    });
  });

  it('keeps the plan when the price names an unknown plan or none', async () => {
    const { service, accounts } = setup();
    accounts.findLatestPlanVersionId.mockResolvedValueOnce(null);

    await service.apply(
      fakeSubscription({ priceLookupKeys: ['crossmart_mystery_monthly'] }),
      'org-1',
    );
    await service.apply(fakeSubscription({ priceLookupKeys: ['legacy_price'] }), 'org-1');

    for (const [, update] of accounts.applySubscription.mock.calls) {
      expect(update.planVersionId).toBe('pv-starter-2');
    }
  });

  it('finds the organization by provider ids when the subscription does not name it', async () => {
    const { service, accounts } = setup();

    await service.apply(fakeSubscription({}), null);

    expect(accounts.findOrganizationId).toHaveBeenCalledWith({
      subscriptionId: 'sub_fake',
      customerId: 'cus_fake',
    });
    expect(accounts.applySubscription).toHaveBeenCalledWith('org-1', expect.anything());
  });

  it('ignores a subscription no organization owns', async () => {
    const { service, accounts } = setup();
    accounts.findOrganizationId.mockResolvedValueOnce(null);

    await service.apply(fakeSubscription({}), null);

    expect(accounts.applySubscription).not.toHaveBeenCalled();
  });

  it('starts the grace period at the first failure and keeps it through retries', async () => {
    const { service, accounts } = setup();
    await service.apply(fakeSubscription({ status: SubscriptionStatus.PAST_DUE }), 'org-1');
    const firstFailure = accounts.applySubscription.mock.calls[0]?.[1].pastDueSince;
    expect(firstFailure).toBeInstanceOf(Date);

    const since = new Date('2026-11-01T00:00:00.000Z');
    accounts.findByOrganization.mockResolvedValueOnce(
      account({ status: SubscriptionStatus.PAST_DUE, pastDueSince: since }),
    );
    await service.apply(fakeSubscription({ status: SubscriptionStatus.PAST_DUE }), 'org-1');
    expect(accounts.applySubscription.mock.calls[1]?.[1].pastDueSince).toEqual(since);
  });

  it('keeps the trial end once set, so a trial is offered once', async () => {
    const trialEnd = new Date('2026-11-14T00:00:00.000Z');
    const { service, accounts } = setup(account({ trialEnd }));

    await service.apply(fakeSubscription({ trialEnd: null }), 'org-1');

    expect(accounts.applySubscription.mock.calls[0]?.[1].trialEnd).toEqual(trialEnd);
  });

  it('does not let an older subscription that ended undo a newer live one', async () => {
    const { service, accounts } = setup(
      account({ status: SubscriptionStatus.ACTIVE, externalSubscriptionId: 'sub_new' }),
    );

    await service.apply(
      fakeSubscription({ id: 'sub_old', status: SubscriptionStatus.CANCELED }),
      'org-1',
    );

    expect(accounts.applySubscription).not.toHaveBeenCalled();
  });
});
