import type { ListingDraftVariant } from '../../sdk/capabilities/listing-publisher.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { mercadoLibreError } from '../mercadolibre-errors.js';
import { identifierAttributes, optionAttributes } from './mercadolibre-attributes.js';
import {
  changedPictures,
  listedQuantity,
  listingPictures,
  mercadoLibrePrice,
} from './mercadolibre-item.mapper.js';
import type { MercadoLibreItem, MercadoLibreVariationInput } from './mercadolibre-item.types.js';
import { formatVariantKey, parseVariantKey } from './mercadolibre-keys.js';
import type { MercadoLibreListingPlan, PublishedVariantKey } from './mercadolibre-listing-plan.js';

export const VARIANT_PRICES_DIFFER =
  'This Mercado Libre account lists variants as variations of one item, which share one price. Give the variants the same price.';

/** Variations of one item share a price (Variations guide); refuses variants priced apart. */
export function sharedPrice(plan: MercadoLibreListingPlan): number {
  const prices = new Set(
    plan.draft.variants.map((variant) => mercadoLibrePrice(variant.price, plan.settings)),
  );
  const [price] = prices;
  if (prices.size !== 1 || price === undefined) {
    throw mercadoLibreError(ChannelErrorCode.RequestRejected, VARIANT_PRICES_DIFFER);
  }
  return price;
}

/** The variation of a variant published before, by its stored key. */
function variationIdOf(variant: ListingDraftVariant): number | null {
  const key = variant.externalVariantId ? parseVariantKey(variant.externalVariantId) : null;
  return key?.variationId ?? null;
}

/**
 * A variant as a variation: its option values (`attribute_combinations`), SKU and barcode, the
 * item's pictures, and Crossmart's variant id. One published before keeps its id and only
 * changes its price, stock, identifiers and, when they changed, pictures: Mercado Libre does
 * not let a variation with sales change its options. Variations left out are deleted.
 */
export function toVariation(
  plan: MercadoLibreListingPlan,
  variant: ListingDraftVariant,
  price: number,
): MercadoLibreVariationInput {
  const variationId = variationIdOf(variant);
  const pictureIds = listingPictures(plan.draft).map((picture) => picture.source);
  const pictures = changedPictures(plan.draft).pictures ? { picture_ids: pictureIds } : {};
  const common = {
    price,
    available_quantity: listedQuantity(variant),
    attributes: identifierAttributes(variant),
  };
  if (variationId !== null) return { id: variationId, ...common, ...pictures };
  return {
    ...common,
    attribute_combinations: optionAttributes(plan.draft, variant, plan.attributes),
    picture_ids: pictureIds,
    seller_custom_field: variant.variantId,
  };
}

/** Each variant's variation on the item: by Crossmart's variant id, else in the order sent. */
export function variationKeys(
  plan: MercadoLibreListingPlan,
  item: MercadoLibreItem,
): PublishedVariantKey[] {
  return plan.draft.variants.map((variant, position) => {
    const variation =
      item.variations.find((candidate) => candidate.seller_custom_field === variant.variantId) ??
      item.variations.find((candidate) => candidate.id === variationIdOf(variant)) ??
      item.variations[position];
    const variationId = variation?.id ?? null;
    return {
      variantId: variant.variantId,
      key: formatVariantKey({ itemId: item.id, variationId }),
    };
  });
}
