import {
  SubscriptionResyncOutcome,
  type SubscriptionResyncResult,
  type SubscriptionResyncService,
} from '@crossmart/core';
import { RESYNC_USAGE } from './billing.constants.js';
import {
  describeResync,
  isBillingResync,
  parseResyncTarget,
  resyncTarget,
} from './resync-subscriptions.js';

function synced(organizationId: string): SubscriptionResyncResult {
  return { organizationId, outcome: SubscriptionResyncOutcome.Synced, subscriptionId: 'sub_1' };
}

async function* yieldAll(
  results: SubscriptionResyncResult[],
): AsyncGenerator<SubscriptionResyncResult> {
  for (const result of results) yield await Promise.resolve(result);
}

async function collect<Item>(items: AsyncIterable<Item>): Promise<Item[]> {
  const collected: Item[] = [];
  for await (const item of items) collected.push(item);
  return collected;
}

function fakeService() {
  return {
    resync: vi.fn((organizationId: string) => Promise.resolve(synced(organizationId))),
    resyncAll: vi.fn(() => yieldAll([synced('org-all')])),
  } satisfies Pick<SubscriptionResyncService, 'resync' | 'resyncAll'>;
}

describe('billing resync command', () => {
  it('starts on --billing-resync only', () => {
    expect(isBillingResync(['node', 'main.js', '--billing-resync', '--all'])).toBe(true);
    expect(isBillingResync(['node', 'main.js'])).toBe(false);
  });

  it('reads organizations, past the `--` pnpm passes on', () => {
    expect(
      parseResyncTarget(['--billing-resync', '--', '--org', 'org-1', '--org', 'org-2']),
    ).toEqual({ all: false, organizationIds: ['org-1', 'org-2'] });
    expect(parseResyncTarget(['--billing-resync', '--all'])).toEqual({ all: true });
  });

  it('wants exactly one of --org and --all', () => {
    expect(() => parseResyncTarget(['--billing-resync'])).toThrow(RESYNC_USAGE);
    expect(() => parseResyncTarget(['--all', '--org', 'org-1'])).toThrow(RESYNC_USAGE);
  });

  it('resyncs the named organizations one after another, or all of them', async () => {
    const service = fakeService();

    const named = await collect(resyncTarget(service, { all: false, organizationIds: ['a', 'b'] }));
    const all = await collect(resyncTarget(service, { all: true }));

    expect(named.map(describeResync)).toEqual(['a synced sub_1', 'b synced sub_1']);
    expect(all.map(describeResync)).toEqual(['org-all synced sub_1']);
  });
});
