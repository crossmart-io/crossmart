import { Injectable } from '@nestjs/common';
import { toProductSummary } from '../../catalog/mappers/product-view.mapper.js';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import type { ChannelProductRow } from '../entities/channel-product.js';
import type { DisplayedProductSummary } from '../entities/store-badge-display.js';
import { toDisplayFields, toListingSummary } from '../mappers/listing.mapper.js';
import {
  type ChannelProductRecord,
  ChannelProductsRepository,
} from '../repositories/channel-products.repository.js';
import {
  type ChannelProductScope,
  channelProductStateOf,
  shownListing,
} from '../rules/channel-product-state-where.js';
import { selectionWhere } from '../rules/selection-where.js';
import { ChannelProductDisplays, type StoreMembership } from './channel-product-displays.js';
import { ProductStoreDisplays } from './product-store-displays.js';

/** What a page's rows share: their store, and which of the page's products it selects. */
interface RowContext extends StoreMembership {
  connection: ChannelConnectionView;
}

/** Turns one page of a store's products into rows: each product's state and display there. */
@Injectable()
export class ChannelProductRows {
  constructor(
    private readonly products: ChannelProductsRepository,
    private readonly storeDisplays: ProductStoreDisplays,
    private readonly displays: ChannelProductDisplays,
  ) {}

  /** Asks the selection and the store badges about the whole page at once, then maps each row. */
  async toRows(
    connection: ChannelConnectionView,
    scope: ChannelProductScope,
    records: ChannelProductRecord[],
  ): Promise<ChannelProductRow[]> {
    const [selected, products] = await Promise.all([
      this.products.matchingIds(
        selectionWhere(scope),
        records.map((record) => record.id),
      ),
      this.storeDisplays.display(
        scope.workspaceId,
        records.map((record) => toProductSummary(record)),
      ),
    ]);
    const context = {
      connection,
      selected,
      removedByHand: new Set(scope.rule?.excludeProductIds ?? []),
    };
    return records.flatMap((record, index) => {
      const product = products[index];
      return product ? [this.toRow(record, product, context)] : [];
    });
  }

  private toRow(
    record: ChannelProductRecord,
    product: DisplayedProductSummary,
    context: RowContext,
  ): ChannelProductRow {
    const { connection } = context;
    const listings = record.listings.filter((entry) => entry.connectionId === connection.id);
    const shown = shownListing(listings);
    const listing = shown ? toListingSummary(shown) : null;
    const candidate = {
      id: record.id,
      status: record.status,
      optionNames: record.optionNames,
      variantCount: record.variants.length,
      imageUrls: product.imageUrl ? [product.imageUrl] : [],
    };
    const display = this.displays.resolve(
      connection,
      { product: candidate, listing, visibleListing: shown },
      context,
    );
    const selected = context.selected.has(record.id);
    const removedByHand = context.removedByHand.has(record.id);
    return {
      product,
      state: channelProductStateOf(selected, listings, removedByHand),
      ...toDisplayFields(display),
      listing,
    };
  }
}
