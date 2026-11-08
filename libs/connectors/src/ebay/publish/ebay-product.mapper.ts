import { truncate } from '@crossmart/common';
import type {
  ListingDraft,
  ListingDraftVariant,
} from '../../sdk/capabilities/listing-publisher.js';
import {
  DIGITS_PATTERN,
  EAN_LENGTH,
  EBAY_DESCRIPTION_MAX_LENGTH,
  EBAY_MAX_IMAGES,
  EBAY_MAX_VARIATION_IMAGES,
  EBAY_TITLE_MAX_LENGTH,
  EBAY_UNTRACKED_QUANTITY,
  HTTPS_PROTOCOL,
  UPC_LENGTH,
} from '../ebay.constants.js';
import type { EbayCondition } from '../listing/ebay-condition.enum.js';
import { listingBrand, productAspects, variantAspects } from './ebay-item-aspects.js';
import type {
  EbayAspects,
  EbayInventoryItemBody,
  EbayInventoryItemGroupBody,
  EbayProductDetails,
  EbaySpecification,
} from './ebay-inventory.types.js';

/** At most 80 characters, cut on whole characters (never inside an emoji or accent). */
export function listingTitle(title: string): string {
  return truncate(title.trim(), EBAY_TITLE_MAX_LENGTH).trim();
}

/** The description eBay shows, or the title when the product has none (eBay needs one). */
export function listingDescription(draft: ListingDraft): string {
  const description = draft.product.descriptionHtml.trim() || draft.product.title;
  return description.slice(0, EBAY_DESCRIPTION_MAX_LENGTH);
}

export function isHttps(url: string): boolean {
  return URL.canParse(url) && new URL(url).protocol === HTTPS_PROTOCOL;
}

/** A product with more than one variant is listed through an inventory item group. */
export function isVariationListing(draft: ListingDraft): boolean {
  return draft.variants.length > 1;
}

/**
 * eBay downloads images itself: only public https URLs, the first `limit` in order. A listing
 * takes 24; each inventory item in a variation group takes 12.
 */
export function listingImageUrls(draft: ListingDraft, limit = EBAY_MAX_IMAGES): string[] {
  return draft.product.images
    .map((image) => image.url)
    .filter(isHttps)
    .slice(0, limit);
}

/** The pictures one inventory item may carry: fewer when it belongs to a variation group. */
function inventoryItemImageLimit(draft: ListingDraft): number {
  return isVariationListing(draft) ? EBAY_MAX_VARIATION_IMAGES : EBAY_MAX_IMAGES;
}

/** A 12-digit barcode is a UPC and a 13-digit one an EAN; others are not sent. */
function barcodeFields(barcode: string | null): Pick<EbayProductDetails, 'upc' | 'ean'> {
  if (!barcode || !DIGITS_PATTERN.test(barcode)) return {};
  if (barcode.length === UPC_LENGTH) return { upc: [barcode] };
  if (barcode.length === EAN_LENGTH) return { ean: [barcode] };
  return {};
}

/** Units eBay may sell: the stock the channel shows, or a fixed amount when untracked. */
export function listedQuantity(variant: ListingDraftVariant): number {
  if (!variant.tracked) return EBAY_UNTRACKED_QUANTITY;
  return Math.max(variant.available ?? 0, 0);
}

function productDetails(
  draft: ListingDraft,
  aspects: EbayAspects,
  imageLimit: number,
): EbayProductDetails {
  const brand = listingBrand(draft);
  return {
    title: listingTitle(draft.product.title),
    description: listingDescription(draft),
    imageUrls: listingImageUrls(draft, imageLimit),
    aspects,
    ...(brand ? { brand } : {}),
  };
}

/** The inventory item of one variant, with at most 12 images when it is part of a group. */
export function toInventoryItem(
  draft: ListingDraft,
  variant: ListingDraftVariant,
  condition: EbayCondition,
): EbayInventoryItemBody {
  return {
    availability: { shipToLocationAvailability: { quantity: listedQuantity(variant) } },
    condition,
    product: {
      ...productDetails(draft, variantAspects(draft, variant), inventoryItemImageLimit(draft)),
      ...barcodeFields(variant.barcode),
    },
  };
}

/** Each option with the values the variants use, in first-seen order. */
function specifications(draft: ListingDraft): EbaySpecification[] {
  return draft.product.optionNames.map((name, index) => ({
    name,
    values: [...new Set(draft.variants.flatMap((variant) => variant.optionValues[index] ?? []))],
  }));
}

/**
 * The group a multi-variant product is listed through; its variants differ by its options. The
 * group's images are the listing's, so it takes up to 24.
 */
export function toInventoryItemGroup(
  draft: ListingDraft,
  skus: ReadonlyMap<string, string>,
): EbayInventoryItemGroupBody {
  const { aspects, ...details } = productDetails(draft, productAspects(draft), EBAY_MAX_IMAGES);
  return {
    title: details.title,
    description: details.description,
    imageUrls: details.imageUrls,
    aspects,
    variantSKUs: draft.variants.flatMap((variant) => skus.get(variant.variantId) ?? []),
    variesBy: { specifications: specifications(draft) },
  };
}
