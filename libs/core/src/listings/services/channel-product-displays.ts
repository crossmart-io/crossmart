import { Injectable } from '@nestjs/common';
import {
  type CountedRecords,
  type PageRequest,
  slicePageWindow,
  type SortDirection,
} from '@crossmart/common';
import { ListingStatus, type Prisma } from '@crossmart/database';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import type { DisplayedListing, ListingDisplay } from '../entities/listing-display.js';
import type { ChannelProductSort } from '../enums/channel-product-state.enum.js';
import { toDisplayedListing } from '../mappers/listing.mapper.js';
import {
  type ChannelProductRecord,
  ChannelProductsRepository,
  type DisplayCandidateRecord,
} from '../repositories/channel-products.repository.js';
import { type ChannelProductScope, shownListing } from '../rules/channel-product-state-where.js';
import type { VisibleListing } from '../rules/listing-visibility.js';
import { type CandidateProduct, publishCandidateOf } from '../rules/publish-candidate.js';
import type { DisplayMatch } from '../rules/channel-product-view.js';
import { selectionWhere } from '../rules/selection-where.js';
import { ListingDisplayResolver, type ListingDisplaySubject } from './listing-display.resolver.js';

/** Which products a store includes, and which the merchant removed by hand. */
export interface StoreMembership {
  selected: ReadonlySet<string>;
  removedByHand: ReadonlySet<string>;
}

/** One product on a store: what the connector checks, and the listing its row shows. */
export interface DisplayedStoreProduct {
  product: CandidateProduct & { id: string };
  listing: DisplayedListing | null;
  /** The same listing, for its visibility override. */
  visibleListing: VisibleListing | null;
}

/** One product on a store as its display state reads it. */
function displaySubjectOf(
  { product, listing, visibleListing }: DisplayedStoreProduct,
  membership: StoreMembership,
): ListingDisplaySubject {
  return {
    selected: membership.selected.has(product.id),
    removedByHand: membership.removedByHand.has(product.id),
    listing,
    candidate: publishCandidateOf(product, visibleListing),
  };
}

/** Whether the channel refused the product's listing on the store: the product is failed. */
export function isRefused({ listing }: DisplayedStoreProduct): boolean {
  return listing?.status === ListingStatus.ERROR;
}

export function toDisplayedStoreProduct(
  record: DisplayCandidateRecord,
  connectionId: string,
): DisplayedStoreProduct {
  const shown = shownListing(
    record.listings.filter((entry) => entry.connectionId === connectionId),
  );
  return {
    product: {
      id: record.id,
      status: record.status,
      optionNames: record.optionNames,
      variantCount: record._count.variants,
      imageUrls: record.media.map((media) => media.url),
    },
    listing: shown ? toDisplayedListing(shown) : null,
    visibleListing: shown,
  };
}

/** A store's products filtered by display state: the store, and its selection. */
export interface DisplayFilterTarget {
  scope: ChannelProductScope;
  connection: ChannelConnectionView;
}

export interface DisplayFilterQuery extends PageRequest {
  sort: ChannelProductSort;
  direction: SortDirection;
}

/**
 * The display states of a store's products, and the lists filtered by them. A filter narrows the
 * query to the product states the display state can come from; what blocks publishing is the
 * connector's to say, so the display of each remaining product is then resolved in code, from
 * one lean query for the candidates and one for which the selection includes. Only the page's
 * rows are loaded in full.
 */
@Injectable()
export class ChannelProductDisplays {
  constructor(
    private readonly products: ChannelProductsRepository,
    private readonly displays: ListingDisplayResolver,
  ) {}

  /** The one state a merchant reads for a product on the store. */
  resolve(
    connection: ChannelConnectionView,
    product: DisplayedStoreProduct,
    membership: StoreMembership,
  ): ListingDisplay {
    return this.displays.resolve(connection, displaySubjectOf(product, membership));
  }

  /**
   * One page of the products of `where` that `matches` keeps, with how many it keeps. Without
   * `matches`, SQL pages them alone.
   */
  async page(
    target: DisplayFilterTarget,
    where: Prisma.ProductWhereInput,
    query: DisplayFilterQuery,
    matches: DisplayMatch | null,
  ): Promise<CountedRecords<ChannelProductRecord>> {
    if (!matches) return this.products.listPage(where, query);
    const matching = await this.matchingIds(target, where, query, matches);
    const pageIds = slicePageWindow(matching, query);
    const records = await this.products.findByIds(target.scope.workspaceId, pageIds);
    return { records, total: matching.length };
  }

  /** The ids of the products of `where` that `matches` keeps, in the list's order. */
  private async matchingIds(
    { scope, connection }: DisplayFilterTarget,
    where: Prisma.ProductWhereInput,
    query: DisplayFilterQuery,
    matches: DisplayMatch,
  ): Promise<string[]> {
    const [candidates, selected] = await Promise.all([
      this.products.listDisplayCandidates(where, query),
      this.products.listIds({ AND: [where, selectionWhere(scope)] }),
    ]);
    const membership = { selected, removedByHand: new Set(scope.rule?.excludeProductIds ?? []) };
    return candidates
      .filter((record) => {
        const product = toDisplayedStoreProduct(record, scope.connectionId);
        return matches(this.resolve(connection, product, membership), isRefused(product));
      })
      .map((record) => record.id);
  }
}
