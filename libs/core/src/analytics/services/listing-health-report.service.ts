import { Injectable } from '@nestjs/common';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import type { ListingStateCounts } from '../../listings/entities/listing-state-counts.js';
import { ListingDisplayState } from '../../listings/enums/listing-display-state.enum.js';
import { ChannelListingsService } from '../../listings/services/channel-listings.service.js';
import { StoreListingStates } from '../../listings/services/store-listing-states.js';
import { RECENT_LISTING_FAILURES_LIMIT } from '../analytics.constants.js';
import type { ListingHealthReport, StoreListingHealth } from '../entities/listing-health-report.js';

function toStoreHealth(
  store: ChannelConnectionView,
  counts: ListingStateCounts,
  failedListings: number,
): StoreListingHealth {
  return {
    connectionId: store.id,
    channel: store.channel,
    displayName: store.displayName,
    status: store.status,
    statusReason: store.statusReason,
    lastSyncedAt: store.lastSyncedAt,
    states: Object.values(ListingDisplayState).map((state) => ({ state, count: counts[state] })),
    failedListings,
  };
}

/**
 * The overview's listing health: each store's products by display state, and the latest
 * listings the channels refused, each with what to fix. A snapshot of now.
 */
@Injectable()
export class ListingHealthReportService {
  constructor(
    private readonly connections: ChannelConnectionsService,
    private readonly listings: ChannelListingsService,
    private readonly states: StoreListingStates,
  ) {}

  async report(workspaceId: string): Promise<ListingHealthReport> {
    const stores = await this.connections.list(workspaceId);
    const [counted, recentFailures, failed] = await Promise.all([
      Promise.all(
        stores.map(async (store) => ({
          store,
          counts: await this.states.count(workspaceId, store),
        })),
      ),
      this.listings.recentFailures(workspaceId, stores, RECENT_LISTING_FAILURES_LIMIT),
      this.listings.failedCounts(workspaceId),
    ]);
    return {
      stores: counted.map(({ store, counts }) =>
        toStoreHealth(store, counts, failed.get(store.id) ?? 0),
      ),
      recentFailures,
      failedListings: [...failed.values()].reduce((sum, count) => sum + count, 0),
    };
  }
}
