import type { AppConfigService } from '@crossmart/common';
import type { ProductsService } from '../../catalog/services/products.service.js';
import type { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import type { EntitlementService } from '../../entitlements/services/entitlement.service.js';
import type { SubscriptionService } from '../../entitlements/services/subscription.service.js';
import type { ChannelListingsService } from '../../listings/services/channel-listings.service.js';
import type { ProductChannelsService } from '../../listings/services/product-channels.service.js';
import { KnowledgeSourceKind } from '../enums/knowledge-source-kind.enum.js';
import { AccountFactPages } from './account-fact-pages.js';
import { ChannelConnectionsLookup } from './channel-connections.lookup.js';
import { FailedListingsLookup } from './failed-listings.lookup.js';
import { ListingStatusLookup } from './listing-status.lookup.js';
import { PlanUsageLookup } from './plan-usage.lookup.js';

const WORKSPACE = 'workspace-mine';
const PRODUCT = { id: 'p1', title: 'Mug', status: 'ACTIVE', variantCount: 1 };
const pages = new AccountFactPages({ webAppUrl: 'https://app.example' } as AppConfigService);

describe('account lookups', () => {
  it('finds products of the workspace by SKU or title, and where each stands', async () => {
    const products = {
      list: vi.fn().mockResolvedValue({ items: [PRODUCT], nextCursor: null, total: 1 }),
    };
    const productChannels = { list: vi.fn().mockResolvedValue([]) };
    const lookup = new ListingStatusLookup(
      products as unknown as ProductsService,
      productChannels as unknown as ProductChannelsService,
      pages,
    );

    const [fact] = await lookup.run(WORKSPACE, 'MUG-1');

    expect(products.list).toHaveBeenCalledWith(
      WORKSPACE,
      expect.objectContaining({ search: 'MUG-1' }),
    );
    expect(productChannels.list).toHaveBeenCalledWith(WORKSPACE, PRODUCT.id);
    expect(fact).toMatchObject({
      source: KnowledgeSourceKind.Account,
      url: 'https://app.example/products/p1',
      title: 'Your workspace › Listing status of "Mug"',
    });
    expect(await lookup.run(WORKSPACE, null)).toEqual([]);
  });

  it('reads the plan of the organization the workspace belongs to', async () => {
    const entitlements = { organizationIdOf: vi.fn().mockResolvedValue('org-1') };
    const subscriptions = {
      overview: vi.fn().mockResolvedValue({
        plan: { name: 'Pro' },
        status: 'ACTIVE',
        currentPeriodEnd: null,
        enforced: false,
        features: [],
      }),
    };
    const lookup = new PlanUsageLookup(
      entitlements as unknown as EntitlementService,
      subscriptions as unknown as SubscriptionService,
      pages,
    );

    const [fact] = await lookup.run(WORKSPACE);

    expect(entitlements.organizationIdOf).toHaveBeenCalledWith(WORKSPACE);
    expect(subscriptions.overview).toHaveBeenCalledWith('org-1');
    expect(fact.text).toContain('Plan: Pro');
  });

  it('reads the workspace’s stores and their failed listings', async () => {
    const connections = { list: vi.fn().mockResolvedValue([]) };
    const listings = { recentFailures: vi.fn().mockResolvedValue([]) };

    const [stores] = await new ChannelConnectionsLookup(
      connections as unknown as ChannelConnectionsService,
      pages,
    ).run(WORKSPACE);
    const [failed] = await new FailedListingsLookup(
      connections as unknown as ChannelConnectionsService,
      listings as unknown as ChannelListingsService,
      pages,
    ).run(WORKSPACE);

    expect(stores.text).toBe('No store is connected.');
    expect(failed.text).toBe('Failed listings: none.');
    expect(connections.list).toHaveBeenCalledWith(WORKSPACE);
    expect(listings.recentFailures).toHaveBeenCalledWith(WORKSPACE, [], expect.any(Number));
  });
});
