import {
  type CategoryAspect,
  CategoryAspectMode,
  CategoryAspectUsage,
} from '../../sdk/capabilities/taxonomy-provider.js';
import {
  MERCADOLIBRE_ATTRIBUTE_VALUES_MAX,
  MercadoLibreAttributeId,
} from '../mercadolibre.constants.js';
import { MercadoLibreValueType } from '../mercadolibre.enums.js';
import type { MercadoLibreAttribute } from './mercadolibre-taxonomy.types.js';

/** Filled from each variant (its SKU and barcode), never asked of the merchant. */
const VARIANT_FILLED: ReadonlySet<string> = new Set([
  MercadoLibreAttributeId.Gtin,
  MercadoLibreAttributeId.SellerSku,
]);

const SELECTION_ONLY: ReadonlySet<string> = new Set([
  MercadoLibreValueType.List,
  MercadoLibreValueType.Boolean,
]);

/**
 * Whether merchants give the attribute: not one sellers cannot set (`read_only`, `fixed`,
 * `inferred`), nor one hidden from Mercado Libre's own sell flow unless it is required.
 */
export function isMerchantAttribute({ id, tags }: MercadoLibreAttribute): boolean {
  if (VARIANT_FILLED.has(id) || tags.read_only || tags.fixed || tags.inferred) return false;
  return !tags.hidden || tags.required === true;
}

function toAspect(attribute: MercadoLibreAttribute): CategoryAspect {
  const { tags } = attribute;
  const recommended = tags.conditional_required || tags.catalog_required;
  return {
    name: attribute.name,
    required: tags.required === true,
    usage: recommended ? CategoryAspectUsage.Recommended : CategoryAspectUsage.Optional,
    mode: SELECTION_ONLY.has(attribute.value_type)
      ? CategoryAspectMode.SelectionOnly
      : CategoryAspectMode.FreeText,
    multiple: tags.multivalued === true,
    values: attribute.values.slice(0, MERCADOLIBRE_ATTRIBUTE_VALUES_MAX).map((value) => value.name),
  };
}

/** A category's attributes as item specifics merchants can give, required ones first. */
export function toCategoryAspects(attributes: readonly MercadoLibreAttribute[]): CategoryAspect[] {
  const aspects = attributes.filter(isMerchantAttribute).map(toAspect);
  const required = aspects.filter((aspect) => aspect.required);
  return [...required, ...aspects.filter((aspect) => !aspect.required)];
}
