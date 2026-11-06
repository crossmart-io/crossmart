import { Injectable } from '@nestjs/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import type {
  InventoryQuantityUpdate,
  InventorySync,
  InventoryUpdateFailure,
} from '../../sdk/capabilities/inventory-sync.js';
import { ChannelError } from '../../sdk/errors/channel-error.js';
import { type EtsyShopContext, etsyShopContext } from '../api/etsy-shop-context.js';
import { ETSY_STOCK_BATCH_SIZE } from '../etsy.constants.js';
import { type EtsyInventoryEdit, InventoryEditOutcome } from '../publish/etsy-inventory-edit.js';
import { EtsyInventoryClient } from '../publish/etsy-inventory.client.js';
import { parseInventoryId } from '../publish/etsy-keys.js';

const NOT_AN_ETSY_ITEM = 'This is not an Etsy listing variant';
const SKU_MISSING = 'The Etsy listing has no variant with this SKU. Publish the listing again.';
const DETAIL_SEPARATOR = ': ';

/** The quantities to set on one listing, by SKU, and the inventory ids they came as. */
interface ListingQuantities {
  listingId: string;
  bySku: Map<string, { externalInventoryId: string; quantity: number }>;
}

function failure(externalInventoryId: string, message: string): InventoryUpdateFailure {
  return { externalInventoryId, message };
}

/** Groups the updates by listing; ids that are not Etsy ones fail at once. */
function groupByListing(updates: readonly InventoryQuantityUpdate[]): {
  listings: ListingQuantities[];
  invalid: InventoryUpdateFailure[];
} {
  const listings = new Map<string, ListingQuantities>();
  const invalid: InventoryUpdateFailure[] = [];
  for (const { externalInventoryId, available } of updates) {
    const ref = parseInventoryId(externalInventoryId);
    if (!ref) {
      invalid.push(failure(externalInventoryId, NOT_AN_ETSY_ITEM));
      continue;
    }
    const listing = listings.get(ref.listingId) ?? { listingId: ref.listingId, bySku: new Map() };
    listing.bySku.set(ref.sku, { externalInventoryId, quantity: Math.max(available, 0) });
    listings.set(ref.listingId, listing);
  }
  return { listings: [...listings.values()], invalid };
}

/** Sets each SKU's quantity; answers the SKUs the listing does not have. */
function applyQuantities(
  edit: EtsyInventoryEdit,
  listing: ListingQuantities,
): InventoryUpdateFailure[] {
  const missing: InventoryUpdateFailure[] = [];
  for (const [sku, { externalInventoryId, quantity }] of listing.bySku) {
    if (edit.setQuantity(sku, quantity) === InventoryEditOutcome.Missing) {
      missing.push(failure(externalInventoryId, SKU_MISSING));
    }
  }
  return missing;
}

/**
 * Sets stock on Etsy through each listing's inventory. A variant's `externalInventoryId` is
 * `{listingId}:{sku}`. Etsy replaces a listing's whole inventory on every write, so each
 * listing's inventory is read, its SKUs' quantities changed, and written back only when one
 * differs: an Etsy sale's own stock change comes back here with the quantity Etsy shows.
 */
@Injectable()
export class EtsyInventorySync implements InventorySync {
  readonly maxBatchSize = ETSY_STOCK_BATCH_SIZE;

  constructor(private readonly inventory: EtsyInventoryClient) {}

  async setQuantities(
    session: ChannelSession,
    updates: readonly InventoryQuantityUpdate[],
  ): Promise<InventoryUpdateFailure[]> {
    if (updates.length === 0) return [];
    const shop = await etsyShopContext(session);
    const { listings, invalid } = groupByListing(updates);
    const failures = [...invalid];
    for (const listing of listings) {
      failures.push(...(await this.setListing(shop, listing)));
    }
    return failures;
  }

  /** A listing Etsy refuses fails its SKUs with Etsy's reason; outages fail the whole job. */
  private async setListing(
    shop: EtsyShopContext,
    listing: ListingQuantities,
  ): Promise<InventoryUpdateFailure[]> {
    try {
      return await this.inventory.modify(shop, listing.listingId, (edit) =>
        applyQuantities(edit, listing),
      );
    } catch (error) {
      if (!(error instanceof ChannelError) || error.retryable) throw error;
      return [...listing.bySku.values()].map(({ externalInventoryId }) =>
        failure(externalInventoryId, `${error.message}${DETAIL_SEPARATOR}${listing.listingId}`),
      );
    }
  }
}
