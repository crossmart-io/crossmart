import { descriptionToPlainText, truncate } from '@crossmart/common';
import type {
  ListingDraft,
  ListingDraftVariant,
} from '../../sdk/capabilities/listing-publisher.js';
import {
  COLOR_OPTION_NAMES,
  GOOGLE_ADDITIONAL_IMAGES_MAX,
  GOOGLE_BRAND_MAX_LENGTH,
  GOOGLE_DESCRIPTION_MAX_LENGTH,
  GOOGLE_OPTION_VALUE_MAX_LENGTH,
  GOOGLE_TITLE_MAX_LENGTH,
  GTIN_PATTERN,
  PRODUCT_URL_HANDLE_PLACEHOLDER,
  SIZE_OPTION_NAMES,
  WEIGHT_UNIT_GRAMS,
} from '../google-merchant.constants.js';
import { toGooglePrices } from './google-price.js';
import { googleConditionOf } from './google-condition.mapper.js';
import {
  GoogleAvailability,
  type GoogleProductAttributes,
  type GoogleProductInput,
} from './google-product-input.js';

const HTTPS_PREFIX = 'https://';

/** Where an offer goes: the country's language, feed label and currency, and the product link. */
export interface GoogleOfferTarget {
  contentLanguage: string;
  feedLabel: string;
  currencyCode: string;
  productUrlTemplate: string;
}

/** Cuts text to Google's limit by characters, never splitting an emoji. */
function cut(text: string, maxLength: number): string {
  return truncate(text.trim(), maxLength).trim();
}

/** The product page: the merchant's template with the product's handle. */
export function productLink(template: string, handle: string): string {
  return template.replace(PRODUCT_URL_HANDLE_PLACEHOLDER, encodeURIComponent(handle));
}

/** Google downloads images itself: only public https URLs, the first as the main image. */
function images(
  draft: ListingDraft,
): Pick<GoogleProductAttributes, 'imageLink' | 'additionalImageLinks'> {
  const [main, ...rest] = draft.product.images
    .map((image) => image.url)
    .filter((url) => url.startsWith(HTTPS_PREFIX));
  if (!main) return {};
  const additional = rest.slice(0, GOOGLE_ADDITIONAL_IMAGES_MAX);
  return {
    imageLink: main,
    ...(additional.length > 0 ? { additionalImageLinks: additional } : {}),
  };
}

function availability(variant: ListingDraftVariant): GoogleAvailability {
  if (!variant.tracked || (variant.available ?? 0) > 0) return GoogleAvailability.InStock;
  return variant.continueSellingWhenOutOfStock
    ? GoogleAvailability.Backorder
    : GoogleAvailability.OutOfStock;
}

/** The value of the option whose name Google reads as this attribute, such as Color. */
function optionValue(
  draft: ListingDraft,
  variant: ListingDraftVariant,
  names: readonly string[],
): string | undefined {
  const index = draft.product.optionNames.findIndex((name) =>
    names.includes(name.trim().toLowerCase()),
  );
  const value = index >= 0 ? variant.optionValues[index] : undefined;
  return value ? cut(value, GOOGLE_OPTION_VALUE_MAX_LENGTH) : undefined;
}

/** A GTIN when the barcode is one; without one, Google is told the product has no identifier. */
function identifiers(
  variant: ListingDraftVariant,
): Pick<GoogleProductAttributes, 'gtins' | 'identifierExists'> {
  const barcode = variant.barcode?.trim();
  return barcode && GTIN_PATTERN.test(barcode) ? { gtins: [barcode] } : { identifierExists: false };
}

function variantAttributes(
  draft: ListingDraft,
  variant: ListingDraftVariant,
): Partial<GoogleProductAttributes> {
  const color = optionValue(draft, variant, COLOR_OPTION_NAMES);
  const size = optionValue(draft, variant, SIZE_OPTION_NAMES);
  return {
    ...identifiers(variant),
    ...(draft.variants.length > 1 ? { itemGroupId: draft.productId } : {}),
    ...(color ? { color } : {}),
    ...(size ? { size } : {}),
    ...(variant.weightGrams
      ? { shippingWeight: { value: variant.weightGrams, unit: WEIGHT_UNIT_GRAMS } }
      : {}),
  };
}

/** One variant as a Google offer, in the target country's language, feed and currency. */
export function toProductInput(
  draft: ListingDraft,
  variant: ListingDraftVariant,
  offerId: string,
  target: GoogleOfferTarget,
): GoogleProductInput {
  const brand = draft.product.vendor?.trim();
  return {
    offerId,
    contentLanguage: target.contentLanguage,
    feedLabel: target.feedLabel,
    productAttributes: {
      title: cut(draft.product.title, GOOGLE_TITLE_MAX_LENGTH),
      description: cut(
        descriptionToPlainText(draft.product.descriptionHtml),
        GOOGLE_DESCRIPTION_MAX_LENGTH,
      ),
      link: productLink(target.productUrlTemplate, draft.product.handle),
      ...images(draft),
      availability: availability(variant),
      condition: googleConditionOf(draft.condition),
      ...toGooglePrices(variant, target.currencyCode),
      ...(brand ? { brand: cut(brand, GOOGLE_BRAND_MAX_LENGTH) } : {}),
      ...variantAttributes(draft, variant),
    },
  };
}
