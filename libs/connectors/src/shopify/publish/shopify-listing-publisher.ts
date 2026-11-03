import { Injectable } from '@nestjs/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import type {
  ListingDraft,
  ListingPublisher,
  PriceUpdate,
  PublishedListing,
} from '../../sdk/capabilities/listing-publisher.js';
import { ShopifyLocations } from '../inventory/shopify-locations.js';
import { PRODUCT_SET_MUTATION, ShopifyProductStatus } from '../graphql/product-set.mutation.js';
import { PRODUCT_STATUS_MUTATION } from '../graphql/product-status.mutation.js';
import { ShopifyAdminClient } from '../graphql/shopify-admin.client.js';
import { assertNoUserErrors } from '../graphql/shopify-user-error.js';
import { VARIANT_PRICES_MUTATION } from '../graphql/variant-prices.mutation.js';
import { toProductSetInput } from './shopify-product.mapper.js';
import { toPublishedListing } from './shopify-published-listing.mapper.js';
import { ChannelError } from '../../sdk/errors/channel-error.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { ChannelType } from '../../sdk/channel-type.enum.js';

const NO_PRODUCT = 'Shopify returned no product';

/**
 * Publishes listings with `productSet`, which creates a product or replaces an existing one
 * (by id) in one call, so publishing again never makes a duplicate. Delisting archives the
 * product: it leaves the store's catalog and sales channels but keeps its orders and history.
 */
@Injectable()
export class ShopifyListingPublisher implements ListingPublisher {
  constructor(
    private readonly admin: ShopifyAdminClient,
    private readonly locations: ShopifyLocations,
  ) {}

  publish(session: ChannelSession, draft: ListingDraft): Promise<PublishedListing> {
    return this.set(session, draft, null);
  }

  update(
    session: ChannelSession,
    externalId: string,
    draft: ListingDraft,
  ): Promise<PublishedListing> {
    return this.set(session, draft, externalId);
  }

  async delist(session: ChannelSession, externalId: string): Promise<void> {
    const { productUpdate } = await this.admin.request(session, PRODUCT_STATUS_MUTATION, {
      product: { id: externalId, status: ShopifyProductStatus.Archived },
    });
    assertNoUserErrors(productUpdate.userErrors);
  }

  /** One call per product, as `productVariantsBulkUpdate` takes one product's variants. */
  async updatePrices(session: ChannelSession, updates: readonly PriceUpdate[]): Promise<void> {
    for (const [productId, variants] of this.groupByProduct(updates)) {
      const { productVariantsBulkUpdate } = await this.admin.request(
        session,
        VARIANT_PRICES_MUTATION,
        { productId, variants },
      );
      assertNoUserErrors(productVariantsBulkUpdate.userErrors);
    }
  }

  private async set(
    session: ChannelSession,
    draft: ListingDraft,
    externalId: string | null,
  ): Promise<PublishedListing> {
    const locationId = await this.locations.primaryLocationId(session);
    const input = toProductSetInput(draft, { locationId, creating: externalId === null });
    const { productSet } = await this.admin.request(session, PRODUCT_SET_MUTATION, {
      ...(externalId ? { identifier: { id: externalId } } : {}),
      input,
    });
    assertNoUserErrors(productSet.userErrors);
    if (!productSet.product) {
      throw new ChannelError(ChannelType.Shopify, ChannelErrorCode.ChannelUnavailable, NO_PRODUCT);
    }
    return toPublishedListing(draft, productSet.product, session.externalAccountId);
  }

  private groupByProduct(
    updates: readonly PriceUpdate[],
  ): Map<string, { id: string; price: string; compareAtPrice: string | null }[]> {
    const groups = new Map<
      string,
      { id: string; price: string; compareAtPrice: string | null }[]
    >();
    for (const update of updates) {
      const variants = groups.get(update.externalProductId) ?? [];
      variants.push({
        id: update.externalVariantId,
        price: update.price,
        compareAtPrice: update.compareAtPrice,
      });
      groups.set(update.externalProductId, variants);
    }
    return groups;
  }
}
