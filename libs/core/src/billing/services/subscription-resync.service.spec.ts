import { RESYNC_PAGE_SIZE } from '../billing.constants.js';
import { SubscriptionResyncOutcome } from '../enums/subscription-resync-outcome.enum.js';
import type { BillingAccountRepository } from '../repositories/billing-account.repository.js';
import { billingAccount } from '../testing/billing-account.fixtures.js';
import { FakeBillingProvider, fakeSubscription } from '../testing/fake-billing-provider.js';
import { SubscriptionResyncService } from './subscription-resync.service.js';
import type { SubscriptionSyncService } from './subscription-sync.service.js';

const SCHEDULED = fakeSubscription({
  cancelAtPeriodEnd: true,
  cancelAt: new Date('2026-11-14T00:00:00.000Z'),
});

function setup() {
  const provider = new FakeBillingProvider();
  provider.subscriptions.set(SCHEDULED.id, SCHEDULED);
  const accounts = {
    findByOrganization: vi
      .fn<BillingAccountRepository['findByOrganization']>()
      .mockResolvedValue(billingAccount({ externalSubscriptionId: SCHEDULED.id })),
    findSubscribedOrganizationIds: vi
      .fn<BillingAccountRepository['findSubscribedOrganizationIds']>()
      .mockResolvedValue([]),
  };
  const sync = { apply: vi.fn<SubscriptionSyncService['apply']>().mockResolvedValue() };
  const service = new SubscriptionResyncService(
    provider,
    accounts as unknown as BillingAccountRepository,
    sync as unknown as SubscriptionSyncService,
  );
  return { service, accounts, sync };
}

async function collect<Item>(items: AsyncIterable<Item>): Promise<Item[]> {
  const collected: Item[] = [];
  for await (const item of items) collected.push(item);
  return collected;
}

describe('SubscriptionResyncService', () => {
  it('applies the subscription as the provider holds it now', async () => {
    const { service, sync } = setup();

    const result = await service.resync('org-1');

    expect(result).toEqual({
      organizationId: 'org-1',
      outcome: SubscriptionResyncOutcome.Synced,
      subscriptionId: SCHEDULED.id,
    });
    expect(sync.apply).toHaveBeenCalledWith(SCHEDULED, 'org-1');
  });

  it('reads nothing for an organization without a subscription, or none at all', async () => {
    const { service, accounts, sync } = setup();
    accounts.findByOrganization.mockResolvedValueOnce(billingAccount()).mockResolvedValueOnce(null);

    expect((await service.resync('org-1')).outcome).toBe(SubscriptionResyncOutcome.NoSubscription);
    expect((await service.resync('org-x')).outcome).toBe(SubscriptionResyncOutcome.NotFound);
    expect(sync.apply).not.toHaveBeenCalled();
  });

  it('resyncs every subscribed organization, a page at a time', async () => {
    const { service, accounts, sync } = setup();
    const firstPage = Array.from({ length: RESYNC_PAGE_SIZE }, (_, index) => `org-${index}`);
    accounts.findSubscribedOrganizationIds
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(['org-last']);

    const results = await collect(service.resyncAll());

    expect(results).toHaveLength(RESYNC_PAGE_SIZE + 1);
    expect(accounts.findSubscribedOrganizationIds.mock.calls).toEqual([
      [null, RESYNC_PAGE_SIZE],
      [firstPage.at(-1), RESYNC_PAGE_SIZE],
    ]);
    expect(sync.apply).toHaveBeenCalledTimes(RESYNC_PAGE_SIZE + 1);
  });

  it('reports an organization that fails and goes on with the rest', async () => {
    const { service, accounts, sync } = setup();
    accounts.findSubscribedOrganizationIds.mockResolvedValueOnce(['org-1', 'org-2']);
    sync.apply.mockRejectedValueOnce(new Error('Provider unavailable'));

    const results = await collect(service.resyncAll());

    expect(results.map((result) => result.outcome)).toEqual([
      SubscriptionResyncOutcome.Failed,
      SubscriptionResyncOutcome.Synced,
    ]);
  });
});
