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

/** eBay downloads images itself: only public https URLs, at most 24. */
export function listingImageUrls(draft: ListingDraft): string[] {
  return draft.product.images
    .map((image) => image.url)
    .filter(isHttps)
    .slice(0, EBAY_MAX_IMAGES);
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

function productDetails(draft: ListingDraft, aspects: EbayAspects): EbayProductDetails {
  const brand = listingBrand(draft);
  return {
    title: listingTitle(draft.product.title),
    description: listingDescription(draft),
    imageUrls: listingImageUrls(draft),
    aspects,
    ...(brand ? { brand } : {}),
  };
}

/** The inventory item of one variant. */
export function toInventoryItem(
  draft: ListingDraft,
  variant: ListingDraftVariant,
  condition: EbayCondition,
): EbayInventoryItemBody {
  return {
    availability: { shipToLocationAvailability: { quantity: listedQuantity(variant) } },
    condition,
    product: {
      ...productDetails(draft, variantAspects(draft, variant)),
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

/** The group a multi-variant product is listed through; its variants differ by its options. */
export function toInventoryItemGroup(
  draft: ListingDraft,
  skus: ReadonlyMap<string, string>,
): EbayInventoryItemGroupBody {
  const { aspects, ...details } = productDetails(draft, productAspects(draft));
  return {
    title: details.title,
    description: details.description,
    imageUrls: details.imageUrls,
    aspects,
    variantSKUs: draft.variants.flatMap((variant) => skus.get(variant.variantId) ?? []),
    variesBy: { specifications: specifications(draft) },
  };
}
