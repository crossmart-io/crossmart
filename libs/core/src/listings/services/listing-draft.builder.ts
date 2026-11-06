import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import type {
  ChannelSettings,
  ExternalImage,
  ListingDraft,
  ListingDraftVariant,
  PriceUpdate,
} from '@crossmart/connectors';
import { sanitizeDescriptionHtml } from '@crossmart/common';
import { OutOfStockPolicy } from '@crossmart/database';
import type { ProductDetail, VariantView } from '../../catalog/entities/product-views.js';
import type {
  PricingContext,
  ResolvedPrice,
  VariantPriceOverride,
} from '../entities/price-resolution.js';
import { PriceWarning } from '../enums/price-warning.enum.js';
import { toPriceOverrides } from '../mappers/listing.mapper.js';
import { listingCategory, listingItemSpecifics } from '../rules/listing-category.js';
import type { ListingSyncRecord } from '../repositories/listing-sync.queries.js';
import { effectiveQuantity } from '../rules/effective-quantity.js';
import { isShownOnChannel } from '../rules/listing-visibility.js';
import { mediaDigest } from '../rules/media-digest.js';
import { ChannelPriceResolver } from './channel-price-resolver.js';

export interface ListingDraftInput {
  product: ProductDetail;
  /** The listing being published or updated; its overrides and channel ids apply. */
  listing: ListingSyncRecord | null;
  pricing: PricingContext;
  /** The connection's account settings, for channels whose listings need them. */
  account?: ChannelSettings | null;
}

export interface BuiltListingDraft {
  draft: ListingDraft;
  /** Digest of the images sent, stored once the publish succeeds. */
  mediaDigest: string;
}

/**
 * The text fields with the listing's overrides applied. The description is sanitized again on
 * the way out, so nothing stored before sanitizing covered overrides is published.
 */
function overriddenText(
  product: ProductDetail,
  override: ListingSyncRecord['override'],
): Pick<ListingDraft['product'], 'title' | 'descriptionHtml' | 'vendor' | 'tags'> {
  return {
    title: override?.title ?? product.title,
    descriptionHtml: sanitizeDescriptionHtml(override?.descriptionHtml ?? product.descriptionHtml),
    vendor: override?.vendor ?? product.vendor,
    tags: override?.tagsOverridden ? override.tags : product.tags,
  };
}

/**
 * Builds what a channel receives for a product: the catalog content with the listing's
 * overrides applied, each variant's channel price, and the stock the channel may show.
 */
@Injectable()
export class ListingDraftBuilder {
  constructor(private readonly prices: ChannelPriceResolver) {}

  build({ product, listing, pricing, account }: ListingDraftInput): BuiltListingDraft {
    const images = this.images(product, listing);
    const digest = mediaDigest(images);
    const priceOverrides = toPriceOverrides(listing);
    return {
      draft: {
        productId: product.id,
        product: this.content(product, listing, images),
        variants: product.variants.map((variant) =>
          this.variant(variant, listing, pricing, priceOverrides.get(variant.id)),
        ),
        imagesChanged: digest !== listing?.mediaDigest,
        accountSettings: account ?? null,
        category: listingCategory(listing),
        itemSpecifics: listingItemSpecifics(listing),
      },
      mediaDigest: digest,
    };
  }

  /** The product's content with the listing's overrides applied. */
  private content(
    product: ProductDetail,
    listing: ListingSyncRecord | null,
    images: ExternalImage[],
  ): ListingDraft['product'] {
    return {
      handle: product.handle,
      ...overriddenText(product, listing?.override ?? null),
      productType: product.productType,
      active: isShownOnChannel(product, listing),
      optionNames: product.optionNames,
      images,
    };
  }

  /** The channel price of every variant the listing holds, for a price-only sync. */
  priceUpdates(
    product: ProductDetail,
    listing: ListingSyncRecord & { externalId: string },
    pricing: PricingContext,
  ): PriceUpdate[] {
    const overrides = toPriceOverrides(listing);
    const byVariant = new Map(product.variants.map((variant) => [variant.id, variant]));
    return listing.variants.flatMap((mapping) => {
      const variant = byVariant.get(mapping.variantId);
      if (!variant) return [];
      const prices = this.sendable(
        this.prices.resolve(variant, pricing, overrides.get(variant.id)),
        pricing,
      );
      return [
        {
          externalProductId: listing.externalId,
          externalVariantId: mapping.externalId,
          price: prices.price,
          compareAtPrice: prices.compareAtPrice,
        },
      ];
    });
  }

  /** A price that could not be converted into the store's currency is never sent. */
  private sendable(prices: ResolvedPrice, pricing: PricingContext): ResolvedPrice {
    if (prices.warnings.includes(PriceWarning.NoExchangeRate)) {
      const from = pricing.conversion?.from ?? '';
      throw new UnprocessableEntityException(
        `No exchange rate from ${from} to ${pricing.currencyCode}. Set one in the store's pricing.`,
      );
    }
    return prices;
  }

  /** The product's images, or the listing's chosen subset in its order. */
  private images(product: ProductDetail, listing: ListingSyncRecord | null): ExternalImage[] {
    const all = product.media.map(({ url, altText }) => ({ url, altText }));
    const override = listing?.override;
    if (!override?.mediaOverridden) return all;
    const byUrl = new Map(all.map((image) => [image.url, image]));
    return override.mediaUrls.flatMap((url) => {
      const image = byUrl.get(url);
      return image ? [image] : [];
    });
  }

  private variant(
    variant: VariantView,
    listing: ListingSyncRecord | null,
    pricing: PricingContext,
    priceOverride: VariantPriceOverride | undefined,
  ): ListingDraftVariant {
    const prices = this.sendable(this.prices.resolve(variant, pricing, priceOverride), pricing);
    const mapping = listing?.variants.find((entry) => entry.variantId === variant.id);
    return {
      variantId: variant.id,
      externalVariantId: mapping?.externalId ?? null,
      sku: variant.sku,
      barcode: variant.barcode,
      optionValues: variant.optionValues,
      price: prices.price,
      compareAtPrice: prices.compareAtPrice,
      unitCost: prices.unitCost,
      tracked: variant.tracked,
      available: variant.tracked
        ? effectiveQuantity(variant.available, listing?.override ?? null)
        : null,
      continueSellingWhenOutOfStock: variant.outOfStockPolicy === OutOfStockPolicy.CONTINUE_SELLING,
      weightGrams: variant.weightGrams,
      requiresShipping: variant.requiresShipping,
      taxable: variant.taxable,
    };
  }
}
