import type { ListingDraft } from '../../sdk/capabilities/listing-publisher.js';
import { FalabellaField } from '../falabella.enums.js';
import type { FalabellaAttribute } from '../taxonomy/falabella-attribute.js';
import { merchantAttributes } from '../taxonomy/falabella-attributes.js';

/** Attribute values a product's variants are sent with, by `FeedName`. */
export interface FalabellaAttributeValues {
  /** From the listing's item specifics: the same for every variant. */
  shared: Map<string, string>;
  /** From each variant's options, by variant id: an option named like the attribute. */
  byVariant: Map<string, Map<string, string>>;
}

/** Attributes Crossmart derives itself when the merchant gives no value. */
const DERIVED_FIELDS: ReadonlySet<string> = new Set([FalabellaField.ConditionType]);

function comparable(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}

/** Whether a merchant's name (an item specific, an option) means the attribute. */
function names(attribute: FalabellaAttribute, name: string): boolean {
  const wanted = comparable(name);
  return wanted === comparable(attribute.label) || wanted === comparable(attribute.feedName);
}

function sharedValues(
  draft: ListingDraft,
  attributes: readonly FalabellaAttribute[],
): Map<string, string> {
  const values = new Map<string, string>();
  for (const attribute of attributes) {
    const specific = draft.itemSpecifics?.find((item) => names(attribute, item.name));
    const [value] = specific?.values ?? [];
    if (value) values.set(attribute.feedName, value);
  }
  return values;
}

function variantValues(
  draft: ListingDraft,
  attributes: readonly FalabellaAttribute[],
): Map<string, Map<string, string>> {
  const variations = attributes.filter((attribute) => attribute.variation);
  return new Map(
    draft.variants.map((variant) => {
      const values = new Map<string, string>();
      draft.product.optionNames.forEach((optionName, index) => {
        const attribute = variations.find((candidate) => names(candidate, optionName));
        const value = variant.optionValues[index];
        if (attribute && value) values.set(attribute.feedName, value);
      });
      return [variant.variantId, values];
    }),
  );
}

export function falabellaAttributeValues(
  draft: ListingDraft,
  attributes: readonly FalabellaAttribute[],
): FalabellaAttributeValues {
  const settable = merchantAttributes(attributes);
  return { shared: sharedValues(draft, settable), byVariant: variantValues(draft, settable) };
}

/** The package weight comes from the variants' weights when every variant has one. */
function weighed(draft: ListingDraft): boolean {
  return draft.variants.every((variant) => (variant.weightGrams ?? 0) > 0);
}

function provided(
  attribute: FalabellaAttribute,
  draft: ListingDraft,
  values: FalabellaAttributeValues,
): boolean {
  if (values.shared.has(attribute.feedName) || DERIVED_FIELDS.has(attribute.feedName)) return true;
  if (attribute.feedName === FalabellaField.PackageWeight && weighed(draft)) return true;
  return [...values.byVariant.values()].every((variant) => variant.has(attribute.feedName));
}

/** The labels of the required attributes the listing gives no value for. */
export function missingRequiredAttributes(
  draft: ListingDraft,
  attributes: readonly FalabellaAttribute[],
  values: FalabellaAttributeValues,
): string[] {
  return merchantAttributes(attributes)
    .filter((attribute) => attribute.required && !provided(attribute, draft, values))
    .map((attribute) => attribute.label);
}
