import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import type { SubscriptionOverview } from '../../entitlements/entities/entitlement-check.js';
import type { StoreListingRow } from '../../listings/entities/listing-views.js';
import { connectionFacts, failedListingFacts, planUsageFacts } from './account-facts.js';

const STORE = {
  id: 'c1',
  displayName: 'My eBay',
  channel: 'ebay',
  status: 'NEEDS_REAUTH',
  statusReason: 'Token expired',
  publishReadiness: { ready: false, unmet: [] },
  lastSyncedAt: null,
} as unknown as ChannelConnectionView;

describe('account facts', () => {
  it('describes each store and why it needs attention', () => {
    expect(connectionFacts([STORE])).toBe(
      '- My eBay (ebay): NEEDS_REAUTH, why: Token expired, publishing not ready, last synced never',
    );
  });

  it('describes failed listings with their store and error', () => {
    const failure = {
      productTitle: 'Mug',
      connectionId: 'c1',
      lastError: 'Missing brand',
      displayReason: null,
      lastSyncedAt: new Date('2026-11-07T10:00:00Z'),
    } as unknown as StoreListingRow;

    expect(failedListingFacts([failure], [STORE])).toBe(
      '- "Mug" on My eBay: Missing brand (at 2026-11-07T10:00:00.000Z)',
    );
  });

  it('describes the plan with usage against each limit', () => {
    const overview = {
      plan: { name: 'Starter' },
      status: 'ACTIVE',
      currentPeriodEnd: null,
      enforced: true,
      features: [
        { feature: 'active_listings', usage: 12, limit: 100, enabled: true },
        { feature: 'autonomous_agents', usage: null, limit: null, enabled: false },
      ],
    } as unknown as SubscriptionOverview;

    expect(planUsageFacts(overview)).toContain('- active_listings: 12 used of 100');
    expect(planUsageFacts(overview)).toContain('- autonomous_agents: not included');
  });
});
