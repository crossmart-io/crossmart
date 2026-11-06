import { Injectable } from '@nestjs/common';
import type { ProductDetail, VariantView } from '../../catalog/entities/product-views.js';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import type { ChannelVariantView, ProductChannelView } from '../entities/listing-views.js';
import type { PricingContext, ResolvedPrice } from '../entities/price-resolution.js';
import { PriceSource } from '../enums/price-source.enum.js';
import {
  toDisplayFields,
  toListingOverrideView,
  toListingSummary,
  toPriceOverrides,
} from '../mappers/listing.mapper.js';
import { candidateProductOf } from '../rules/candidate-product.js';
import { publishCandidateOf } from '../rules/publish-candidate.js';
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
      candidate: publishCandidateOf(candidateProductOf(product, listing), listing),
    });
    return {
      connection: { ...this.connectionSummary(view), currencyCode: pricing.currencyCode },
      selected,
      ...toDisplayFields(display),
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
    return product.variants.map((variant) => {
      const price = this.prices.resolve(variant, pricing, priceOverrides.get(variant.id));
      return {
        variantId: variant.id,
        title: variantTitle(variant),
        price,
        rulePrice: this.rulePrice(variant, pricing, price),
        quantity: variant.tracked
          ? effectiveQuantity(variant.available, listing?.override ?? null)
          : null,
      };
    });
  }

  /** The rule's price: the resolved one, unless a fixed price replaced it on the listing. */
  private rulePrice(variant: VariantView, pricing: PricingContext, price: ResolvedPrice): string {
    if (price.source !== PriceSource.Override) return price.price;
    return this.prices.resolve(variant, pricing).price;
  }
}
