import type {
  ListingDraft,
  ListingDraftVariant,
} from '../../sdk/capabilities/listing-publisher.js';
import {
  ETSY_CUSTOM_PROPERTY_IDS,
  ETSY_THREE_VARIATIONS,
  ETSY_TWO_VARIATIONS,
} from '../etsy.constants.js';
import type {
  EtsyInventoryInput,
  EtsyProductInput,
  EtsyPropertyValueInput,
} from './etsy-listing.types.js';
import { listedQuantity } from './etsy-listing.mapper.js';
import { toEtsyPrice } from './etsy-money.js';
import { etsyPropertyValue } from './etsy-text.js';

/** A custom variation property: Etsy's id for it, and the merchant's option name. */
interface VariationProperty {
  propertyId: number;
  name: string;
}

/** An inventory to write, and the `max_variations_supported` it needs (three variations). */
export interface PlannedInventory {
  body: EtsyInventoryInput;
  maxVariations: string | null;
}

/** The variations of a product with several variants: one custom property per option. */
function variationProperties(draft: ListingDraft): VariationProperty[] {
  if (draft.variants.length <= 1) return [];
  return draft.product.optionNames.map((name, index) => ({
    propertyId: ETSY_CUSTOM_PROPERTY_IDS[index] ?? 0,
    name,
  }));
}

function propertyValuesOf(
  variant: ListingDraftVariant,
  properties: readonly VariationProperty[],
): EtsyPropertyValueInput[] {
  return properties.map(({ propertyId, name }, index) => ({
    property_id: propertyId,
    property_name: name,
    value_ids: [],
    values: [etsyPropertyValue(variant.optionValues[index] ?? '')],
  }));
}

/**
 * The inventory of a draft: one product per variant, keyed by its SKU, with one offering at
 * its price and stock under the processing profile. Several variants vary by custom
 * properties (one per option), which set the price, stock and SKU; the processing profile is
 * the listing's.
 */
export function toInventoryInput(
  draft: ListingDraft,
  skus: ReadonlyMap<string, string>,
  processingProfileId: string,
): PlannedInventory {
  const properties = variationProperties(draft);
  const products: EtsyProductInput[] = draft.variants.map((variant) => ({
    sku: skus.get(variant.variantId) ?? variant.variantId,
    property_values: propertyValuesOf(variant, properties),
    offerings: [
      {
        price: toEtsyPrice(variant.price),
        quantity: listedQuantity(variant),
        is_enabled: true,
        readiness_state_id: Number(processingProfileId),
      },
    ],
  }));
  const propertyIds = properties.map(({ propertyId }) => propertyId);
  return {
    body: {
      products,
      price_on_property: propertyIds,
      quantity_on_property: propertyIds,
      sku_on_property: propertyIds,
      readiness_state_on_property: [],
    },
    maxVariations: propertyIds.length > ETSY_TWO_VARIATIONS ? ETSY_THREE_VARIATIONS : null,
  };
}
