import { Injectable } from '@nestjs/common';
import type { ProductDetail } from '../../catalog/entities/product-views.js';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import type { ChannelVariantView, ProductChannelView } from '../entities/listing-views.js';
import type { PricingContext } from '../entities/price-resolution.js';
import {
  toListingOverrideView,
  toListingSummary,
  toPriceOverrides,
} from '../mappers/listing.mapper.js';
import type { ListingSyncRecord } from '../repositories/listing-sync.queries.js';
import { effectiveQuantity } from '../rules/effective-quantity.js';
import { variantTitle } from '../rules/variant-title.js';
import { ChannelPriceResolver } from './channel-price-resolver.js';
import { ListingDisplayResolver } from './listing-display.resolver.js';
import { PricingContextFactory } from './pricing-context.factory.js';
import { ProductSelectionService } from './product-selection.service.js';

/** Builds how one product stands on one connection: listing, overrides, prices and stock. */
@Injectable()
export class ProductChannelViews {
  constructor(
    private readonly prices: ChannelPriceResolver,
    private readonly selection: ProductSelectionService,
    private readonly pricingContexts: PricingContextFactory,
    private readonly displays: ListingDisplayResolver,
  ) {}

  async build(
    workspaceId: string,
    product: ProductDetail,
    view: ChannelConnectionView,
    listing: ListingSyncRecord | null,
  ): Promise<ProductChannelView> {
    const pricing = await this.pricingContexts.build(workspaceId, view.settings);
    const rule = view.settings.productSelection;
    const selected = await this.selection.includes(
      { workspaceId, connectionId: view.id, rule },
      product.id,
    );
    const summary = listing ? toListingSummary(listing) : null;
    const display = this.displays.resolve(view, {
      selected,
      removedByHand: rule?.excludeProductIds.includes(product.id) ?? false,
      listing: summary,
      imageUrls: product.media.map((media) => media.url),
    });
    return {
      connection: { ...this.connectionSummary(view), currencyCode: pricing.currencyCode },
      selected,
      displayState: display.state,
      displayReason: display.reason,
      listing: summary,
      override: listing ? toListingOverrideView(listing) : null,
      variants: this.variants(product, pricing, listing),
    };
  }

  private connectionSummary(
    view: ChannelConnectionView,
  ): Omit<ProductChannelView['connection'], 'currencyCode'> {
    const { id, channel, displayName, status } = view;
    return { id, channel, displayName, status };
  }

  private variants(
    product: ProductDetail,
    pricing: PricingContext,
    listing: ListingSyncRecord | null,
  ): ChannelVariantView[] {
    const priceOverrides = toPriceOverrides(listing);
    return product.variants.map((variant) => ({
      variantId: variant.id,
      title: variantTitle(variant),
      price: this.prices.resolve(variant, pricing, priceOverrides.get(variant.id)),
      quantity: variant.tracked
        ? effectiveQuantity(variant.available, listing?.override ?? null)
        : null,
    }));
  }
}
