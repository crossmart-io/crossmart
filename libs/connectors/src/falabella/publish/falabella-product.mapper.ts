import type {
  ListingDraft,
  ListingDraftVariant,
} from '../../sdk/capabilities/listing-publisher.js';
import type { ChannelCategory } from '../../sdk/capabilities/taxonomy-provider.js';
import {
  FALABELLA_GENERIC_BRAND,
  FALABELLA_UNTRACKED_QUANTITY,
  VARIATION_SEPARATOR,
} from '../falabella.constants.js';
import {
  FalabellaAttributePlacement,
  type FalabellaCountry,
  FalabellaField,
  FalabellaProductStatus,
} from '../falabella.enums.js';
import type { FalabellaAttribute } from '../taxonomy/falabella-attribute.js';
import { groupsVariations } from '../taxonomy/falabella-attributes.js';
import type { FalabellaAttributeValues } from './falabella-attribute-values.js';
import { toFalabellaCondition } from './falabella-condition.js';
import { falabellaPrice, falabellaWeight } from './falabella-values.js';

type XmlFields = Record<string, unknown>;

/** Everything a product's XML is built from. */
export interface FalabellaProductPlan {
  draft: ListingDraft;
  country: FalabellaCountry;
  category: ChannelCategory;
  attributes: readonly FalabellaAttribute[];
  values: FalabellaAttributeValues;
  /** Each variant's seller SKU, by variant id. */
  skus: ReadonlyMap<string, string>;
}

export function skuOf(plan: FalabellaProductPlan, variant: ListingDraftVariant): string {
  return plan.skus.get(variant.variantId) ?? variant.variantId;
}

/** The SKU the variants are grouped under, in categories that group variations. */
export function parentSkuOf(plan: FalabellaProductPlan): string | null {
  const [first] = plan.draft.variants;
  const grouped = plan.draft.variants.length > 1 && groupsVariations(plan.attributes);
  if (!first || !grouped) return null;
  return skuOf(plan, first);
}

export function listingStatus(draft: ListingDraft): FalabellaProductStatus {
  return draft.product.active ? FalabellaProductStatus.Active : FalabellaProductStatus.Inactive;
}

function stockOf(variant: ListingDraftVariant): number {
  return variant.tracked ? Math.max(variant.available ?? 0, 0) : FALABELLA_UNTRACKED_QUANTITY;
}

/** The variant's price, stock and status in the connection's country. */
function businessUnit(plan: FalabellaProductPlan, variant: ListingDraftVariant): XmlFields {
  return {
    [FalabellaField.BusinessUnit]: {
      [FalabellaField.OperatorCode]: plan.country,
      [FalabellaField.Price]: falabellaPrice(variant.price),
      [FalabellaField.Stock]: stockOf(variant),
      [FalabellaField.Status]: listingStatus(plan.draft),
    },
  };
}

/** The variant's values of the attributes that go in `placement`, by element name. */
function attributeFields(
  plan: FalabellaProductPlan,
  variant: ListingDraftVariant,
  placement: FalabellaAttributePlacement,
): XmlFields {
  const own = plan.values.byVariant.get(variant.variantId);
  const fields: XmlFields = {};
  for (const attribute of plan.attributes) {
    const value = own?.get(attribute.feedName) ?? plan.values.shared.get(attribute.feedName);
    if (attribute.placement === placement && value) fields[attribute.feedName] = value;
  }
  return fields;
}

/** The condition and package weight Crossmart derives; the merchant's values win. */
function productData(plan: FalabellaProductPlan, variant: ListingDraftVariant): XmlFields {
  const weight = variant.weightGrams ? falabellaWeight(variant.weightGrams) : null;
  return {
    [FalabellaField.ConditionType]: toFalabellaCondition(plan.draft.condition),
    ...(weight ? { [FalabellaField.PackageWeight]: weight } : {}),
    ...attributeFields(plan, variant, FalabellaAttributePlacement.ProductData),
  };
}

/** In a category without grouped variations, each variant says what it is (`Red / M`). */
function variationField(plan: FalabellaProductPlan, variant: ListingDraftVariant): XmlFields {
  const label = variant.optionValues.join(VARIATION_SEPARATOR);
  if (groupsVariations(plan.attributes) || !label) return {};
  return { [FalabellaField.Variation]: label };
}

function identity(plan: FalabellaProductPlan, variant: ListingDraftVariant): XmlFields {
  const parentSku = parentSkuOf(plan);
  const { product } = plan.draft;
  return {
    [FalabellaField.SellerSku]: skuOf(plan, variant),
    ...(parentSku ? { [FalabellaField.ParentSku]: parentSku } : {}),
    [FalabellaField.Name]: product.title,
    ...variationField(plan, variant),
    [FalabellaField.PrimaryCategory]: plan.category.id,
    [FalabellaField.Description]: product.descriptionHtml,
    [FalabellaField.Brand]: product.vendor?.trim() || FALABELLA_GENERIC_BRAND,
    ...(variant.barcode ? { [FalabellaField.ProductId]: variant.barcode } : {}),
  };
}

/** One `<Product>` per variant: Falabella lists each variation as a product with its own SKU. */
export function toFalabellaProducts(plan: FalabellaProductPlan): XmlFields[] {
  return plan.draft.variants.map((variant) => ({
    ...identity(plan, variant),
    ...attributeFields(plan, variant, FalabellaAttributePlacement.Product),
    [FalabellaField.BusinessUnits]: businessUnit(plan, variant),
    [FalabellaField.ProductData]: productData(plan, variant),
  }));
}
