import { ChannelConnectionStatus } from '@crossmart/database';
import type { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import type { ListingStateCounts } from '../../listings/entities/listing-state-counts.js';
import type { StoreListingRow } from '../../listings/entities/listing-views.js';
import { ListingDisplayState } from '../../listings/enums/listing-display-state.enum.js';
import type { ChannelListingsService } from '../../listings/services/channel-listings.service.js';
import type { StoreListingStates } from '../../listings/services/store-listing-states.js';
import { connectionView } from '../../listings/testing/listing.fixtures.js';
import { RECENT_LISTING_FAILURES_LIMIT } from '../analytics.constants.js';
import { ListingHealthReportService } from './listing-health-report.service.js';

const NORTH = connectionView({ id: 'c-1', displayName: 'North' });
const SOUTH = connectionView({
  id: 'c-2',
  displayName: 'South',
  status: ChannelConnectionStatus.NEEDS_REAUTH,
  statusReason: 'Reconnect',
});

function counts(published: number): ListingStateCounts {
  const zero = Object.fromEntries(
    Object.values(ListingDisplayState).map((state) => [state, 0]),
  ) as ListingStateCounts;
  return { ...zero, [ListingDisplayState.Published]: published };
}

function setup() {
  const failure = { id: 'l-1', connectionId: 'c-1' } as StoreListingRow;
  const connections = {
    list: vi.fn<ChannelConnectionsService['list']>().mockResolvedValue([NORTH, SOUTH]),
  };
  const listings = {
    recentFailures: vi.fn<ChannelListingsService['recentFailures']>().mockResolvedValue([failure]),
    failedCounts: vi
      .fn<ChannelListingsService['failedCounts']>()
      .mockResolvedValue(new Map([['c-1', 3]])),
  };
  const states = {
    count: vi
      .fn<StoreListingStates['count']>()
      .mockImplementation((_workspaceId, store) =>
        Promise.resolve(counts(store.id === 'c-1' ? 7 : 0)),
      ),
  };
  const service = new ListingHealthReportService(
    connections as unknown as ChannelConnectionsService,
    listings as unknown as ChannelListingsService,
    states as unknown as StoreListingStates,
  );
  return { service, listings, failure };
}

describe('ListingHealthReportService', () => {
  it('gives every store every display state in order, with its connection', async () => {
    const report = await setup().service.report('ws-1');

    expect(report.stores.map((store) => store.displayName)).toEqual(['North', 'South']);
    expect(report.stores[0]?.states.map((entry) => entry.state)).toEqual(
      Object.values(ListingDisplayState),
    );
    expect(report.stores[0]?.states).toContainEqual({
      state: ListingDisplayState.Published,
      count: 7,
    });
    expect(report.stores[1]).toMatchObject({
      status: ChannelConnectionStatus.NEEDS_REAUTH,
      statusReason: 'Reconnect',
      failedListings: 0,
    });
  });

  it('adds the latest failures and the failed total across stores', async () => {
    const { service, listings, failure } = setup();

    const report = await service.report('ws-1');

    expect(listings.recentFailures).toHaveBeenCalledWith(
      'ws-1',
      [NORTH, SOUTH],
      RECENT_LISTING_FAILURES_LIMIT,
    );
    expect(report.recentFailures).toEqual([failure]);
    expect(report.stores[0]?.failedListings).toBe(3);
    expect(report.failedListings).toBe(3);
  });
});
