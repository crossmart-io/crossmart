import { Injectable } from '@nestjs/common';
import type { ProductStoreBadge, ProductSummary } from '../../catalog/entities/product-views.js';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import type { ListingDisplay } from '../entities/listing-display.js';
import type {
  DisplayedProductSummary,
  DisplayedStoreBadge,
} from '../entities/store-badge-display.js';
import { toDisplayedListing, toDisplayFields } from '../mappers/listing.mapper.js';
import {
  ChannelProductsRepository,
  type StoreBadgeListingRecord,
} from '../repositories/channel-products.repository.js';
import { shownListing } from '../rules/channel-product-state-where.js';
import { listingDisplayOf } from '../rules/listing-display-state.js';
import { publishCandidateOfRecord } from '../rules/publish-candidate.js';
import { selectionWhere } from '../rules/selection-where.js';
import { ListingDisplayResolver } from './listing-display.resolver.js';

/** Everything the badges of one page read, loaded once for the page. */
interface BadgeContext {
  connections: Map<string, ChannelConnectionView>;
  /** Per store, the page's products its selection includes. */
  selected: Map<string, Set<string>>;
  /** Per store, each product's listings there, oldest first. */
  listings: Map<string, Map<string, StoreBadgeListingRecord[]>>;
}

function groupByStore(
  records: StoreBadgeListingRecord[],
): Map<string, Map<string, StoreBadgeListingRecord[]>> {
  const byStore = new Map<string, Map<string, StoreBadgeListingRecord[]>>();
  for (const record of records) {
    const byProduct = byStore.get(record.connectionId) ?? new Map();
    byProduct.set(record.productId, [...(byProduct.get(record.productId) ?? []), record]);
    byStore.set(record.connectionId, byProduct);
  }
  return byStore;
}

function isRemovedByHand(
  connection: ChannelConnectionView | undefined,
  productId: string,
): boolean {
  return connection?.settings.productSelection?.excludeProductIds.includes(productId) ?? false;
}

/** The store ids of a page's badges, each with the products that show a badge for it. */
function productsByStore(summaries: readonly ProductSummary[]): Map<string, string[]> {
  const byStore = new Map<string, string[]>();
  for (const summary of summaries) {
    for (const badge of summary.stores) {
      byStore.set(badge.connectionId, [...(byStore.get(badge.connectionId) ?? []), summary.id]);
    }
  }
  return byStore;
}

/**
 * Gives each store badge of a product list its display state, by the same rule as the store's
 * own pages. A page costs a fixed number of queries whatever its size: the workspace's stores,
 * one selection query per store on the page, and one query for the badges' listings.
 */
@Injectable()
export class ProductStoreDisplays {
  constructor(
    private readonly connections: ChannelConnectionsService,
    private readonly products: ChannelProductsRepository,
    private readonly displays: ListingDisplayResolver,
  ) {}

  async display(
    workspaceId: string,
    summaries: readonly ProductSummary[],
  ): Promise<DisplayedProductSummary[]> {
    const context = await this.load(workspaceId, summaries);
    return summaries.map((summary) => ({
      ...summary,
      stores: summary.stores.map((badge) => this.badge(summary.id, badge, context)),
    }));
  }

  private async load(
    workspaceId: string,
    summaries: readonly ProductSummary[],
  ): Promise<BadgeContext> {
    const byStore = productsByStore(summaries);
    if (byStore.size === 0) {
      return { connections: new Map(), selected: new Map(), listings: new Map() };
    }
    const views = await this.connections.list(workspaceId);
    const connections = new Map(views.map((view) => [view.id, view]));
    const [selected, records] = await Promise.all([
      this.selectedByStore(workspaceId, byStore, connections),
      this.products.listStoreBadgeListings(
        workspaceId,
        summaries.map((summary) => summary.id),
        [...byStore.keys()],
      ),
    ]);
    return { connections, selected, listings: groupByStore(records) };
  }

  /** One selection query per store on the page, for that store's products only. */
  private async selectedByStore(
    workspaceId: string,
    byStore: Map<string, string[]>,
    connections: Map<string, ChannelConnectionView>,
  ): Promise<Map<string, Set<string>>> {
    const entries = await Promise.all(
      [...byStore].map(async ([connectionId, productIds]): Promise<[string, Set<string>]> => {
        const rule = connections.get(connectionId)?.settings.productSelection ?? null;
        const scope = { workspaceId, connectionId, rule };
        return [connectionId, await this.products.matchingIds(selectionWhere(scope), productIds)];
      }),
    );
    return new Map(entries);
  }

  private badge(
    productId: string,
    badge: ProductStoreBadge,
    context: BadgeContext,
  ): DisplayedStoreBadge {
    return { ...badge, ...toDisplayFields(this.badgeDisplay(productId, badge, context)) };
  }

  private badgeDisplay(
    productId: string,
    { connectionId }: ProductStoreBadge,
    context: BadgeContext,
  ): ListingDisplay {
    const connection = context.connections.get(connectionId);
    const record = shownListing(context.listings.get(connectionId)?.get(productId) ?? []);
    const subject = {
      selected: context.selected.get(connectionId)?.has(productId) ?? false,
      removedByHand: isRemovedByHand(connection, productId),
      listing: record ? toDisplayedListing(record) : null,
    };
    if (!connection || !record) return listingDisplayOf({ ...subject, blockers: [] });
    return this.displays.resolve(connection, {
      ...subject,
      candidate: publishCandidateOfRecord(record.product, record),
    });
  }
}
