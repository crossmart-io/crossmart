import { Injectable } from '@nestjs/common';
import type { ProductDetail } from '../../catalog/entities/product-views.js';
import type { ProductChannelView } from '../entities/listing-views.js';
import {
  toListingOverrideView,
  toListingSummary,
  toPriceOverrides,
} from '../mappers/listing.mapper.js';
import type { ListingSyncRecord } from '../repositories/listing-sync.queries.js';
import { effectiveQuantity } from '../rules/effective-quantity.js';
import { variantTitle } from '../rules/variant-title.js';
import { ChannelPriceResolver } from './channel-price-resolver.js';
import { ProductSelectionService } from './product-selection.service.js';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import { PricingContextFactory } from './pricing-context.factory.js';

/** Builds how one product stands on one connection: listing, overrides, prices and stock. */
@Injectable()
export class ProductChannelViews {
  constructor(
    private readonly prices: ChannelPriceResolver,
    private readonly selection: ProductSelectionService,
    private readonly pricingContexts: PricingContextFactory,
  ) {}

  async build(
    workspaceId: string,
    product: ProductDetail,
    view: ChannelConnectionView,
    listing: ListingSyncRecord | null,
  ): Promise<ProductChannelView> {
    const pricing = await this.pricingContexts.build(workspaceId, view.settings);
    const priceOverrides = toPriceOverrides(listing);
    return {
      connection: {
        id: view.id,
        channel: view.channel,
        displayName: view.displayName,
        status: view.status,
        currencyCode: pricing.currencyCode,
      },
      selected: await this.selection.includes(
        { workspaceId, connectionId: view.id, rule: view.settings.productSelection },
        product.id,
      ),
      listing: listing ? toListingSummary(listing) : null,
      override: listing ? toListingOverrideView(listing) : null,
      variants: product.variants.map((variant) => ({
        variantId: variant.id,
        title: variantTitle(variant),
        price: this.prices.resolve(variant, pricing, priceOverrides.get(variant.id)),
        quantity: variant.tracked
          ? effectiveQuantity(variant.available, listing?.override ?? null)
          : null,
      })),
    };
  }
}
