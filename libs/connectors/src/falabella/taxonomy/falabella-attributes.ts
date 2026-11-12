import {
  CategoryAspectMode,
  CategoryAspectUsage,
  type CategoryAspect,
} from '../../sdk/capabilities/taxonomy-provider.js';
import {
  ATTRIBUTE_MANDATORY,
  ATTRIBUTE_NOT_GLOBAL,
  VARIATION_ATTRIBUTE_GROUP,
} from '../falabella.constants.js';
import {
  FalabellaAttributePlacement,
  FalabellaAttributeType,
  FalabellaCondition,
  FalabellaCountry,
  FalabellaField,
} from '../falabella.enums.js';
import { falabellaCountry } from '../falabella-countries.js';
import type { FalabellaAttribute } from './falabella-attribute.js';
import type { FalabellaCategoryAttribute } from './falabella-taxonomy.types.js';

/** Fields Crossmart fills from the product itself; they are never asked as item specifics. */
const PRODUCT_FIELDS: ReadonlySet<string> = new Set([
  FalabellaField.SellerSku,
  FalabellaField.ParentSku,
  FalabellaField.Name,
  FalabellaField.Description,
  FalabellaField.Brand,
  FalabellaField.PrimaryCategory,
  FalabellaField.Categories,
  FalabellaField.ProductId,
  FalabellaField.Variation,
  FalabellaField.Price,
  FalabellaField.SalePrice,
  FalabellaField.SpecialPrice,
  FalabellaField.SpecialFromDate,
  FalabellaField.SpecialToDate,
  FalabellaField.Stock,
  FalabellaField.Quantity,
  FalabellaField.Status,
]);

function dataAttribute(
  feedName: FalabellaField,
  label: string,
  required = true,
): FalabellaAttribute {
  return {
    feedName,
    label,
    required,
    placement: FalabellaAttributePlacement.ProductData,
    variation: false,
    options: [],
  };
}

/**
 * What every product takes in every category, per the ProductCreate docs. They are added when
 * a category does not list them, so a merchant is asked for the package size before Falabella
 * refuses a product without it. The condition is derived from the product's own.
 */
function baseAttributes(country: FalabellaCountry): FalabellaAttribute[] {
  const base = [
    dataAttribute(FalabellaField.PackageHeight, 'Package height (cm)'),
    dataAttribute(FalabellaField.PackageWidth, 'Package width (cm)'),
    dataAttribute(FalabellaField.PackageLength, 'Package length (cm)'),
    dataAttribute(FalabellaField.PackageWeight, 'Package weight (kg)'),
    {
      ...dataAttribute(FalabellaField.ConditionType, 'Condition', false),
      options: Object.values(FalabellaCondition),
    },
  ];
  return falabellaCountry(country).requiresTaxPercentage
    ? [...base, dataAttribute(FalabellaField.TaxPercentage, 'Tax percentage')]
    : base;
}

function isVariationAttribute(raw: FalabellaCategoryAttribute): boolean {
  return (
    raw.GroupName === VARIATION_ATTRIBUTE_GROUP && raw.IsGlobalAttribute === ATTRIBUTE_NOT_GLOBAL
  );
}

/** System and variation attributes go on the product; the rest in its `ProductData`. */
export function toFalabellaAttribute(raw: FalabellaCategoryAttribute): FalabellaAttribute {
  const variation = isVariationAttribute(raw);
  const onProduct = variation || raw.AttributeType === FalabellaAttributeType.System;
  return {
    label: raw.Label,
    feedName: raw.FeedName ?? raw.Name,
    required: raw.isMandatory === ATTRIBUTE_MANDATORY,
    placement: onProduct
      ? FalabellaAttributePlacement.Product
      : FalabellaAttributePlacement.ProductData,
    variation,
    options: (raw.Options?.Option ?? []).map((option) => option.Name),
  };
}

/** The category's attributes, with the base ones it does not list. */
export function categoryAttributes(
  raw: readonly FalabellaCategoryAttribute[],
  country: FalabellaCountry,
): FalabellaAttribute[] {
  const attributes = raw.map(toFalabellaAttribute);
  const listed = new Set(attributes.map((attribute) => attribute.feedName));
  return [...attributes, ...baseAttributes(country).filter((base) => !listed.has(base.feedName))];
}

/** Whether the category groups variations: it does unless it has a `Variation` attribute. */
export function groupsVariations(attributes: readonly FalabellaAttribute[]): boolean {
  return !attributes.some((attribute) => attribute.feedName === FalabellaField.Variation);
}

/** The attributes a merchant can set; Crossmart fills the product's own fields. */
export function merchantAttributes(
  attributes: readonly FalabellaAttribute[],
): FalabellaAttribute[] {
  return attributes.filter((attribute) => !PRODUCT_FIELDS.has(attribute.feedName));
}

function toAspect(attribute: FalabellaAttribute): CategoryAspect {
  const hasOptions = attribute.options.length > 0;
  return {
    name: attribute.label,
    required: attribute.required,
    usage: attribute.variation ? CategoryAspectUsage.Recommended : CategoryAspectUsage.Optional,
    mode: hasOptions ? CategoryAspectMode.SelectionOnly : CategoryAspectMode.FreeText,
    multiple: false,
    values: attribute.options,
  };
}

/** The item specifics a merchant can set in the category, required ones first. */
export function toCategoryAspects(attributes: readonly FalabellaAttribute[]): CategoryAspect[] {
  const aspects = merchantAttributes(attributes).map(toAspect);
  const required = aspects.filter((aspect) => aspect.required);
  return [...required, ...aspects.filter((aspect) => !aspect.required)];
}
