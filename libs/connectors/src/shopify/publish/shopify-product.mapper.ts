import type {
  ListingDraft,
  ListingDraftVariant,
} from '../../sdk/capabilities/listing-publisher.js';
import {
  ShopifyFileContentType,
  type ShopifyFileSetInput,
  ShopifyInventoryPolicy,
  type ShopifyInventoryItemInput,
  type ShopifyOptionSetInput,
  type ShopifyOptionValueInput,
  type ShopifyProductSetInput,
  ShopifyProductStatus,
  type ShopifyVariantSetInput,
  ShopifyWeightUnit,
} from '../graphql/product-set.mutation.js';
import {
  SHOPIFY_AVAILABLE_QUANTITY_NAME,
  SHOPIFY_DEFAULT_OPTION_NAME,
  SHOPIFY_DEFAULT_OPTION_VALUE,
  SHOPIFY_FIRST_POSITION,
} from '../shopify.constants.js';

/** Where new variants get their opening stock: the primary location, when there is one. */
export interface ProductSetContext {
  locationId: string | null;
  /** True when the product does not exist on Shopify yet. */
  creating: boolean;
}

/** Option names, or Shopify's placeholder option for a product without any. */
function optionNamesOf(draft: ListingDraft): string[] {
  return draft.product.optionNames.length > 0
    ? draft.product.optionNames
    : [SHOPIFY_DEFAULT_OPTION_NAME];
}

function optionValuesOf(draft: ListingDraft, variant: ListingDraftVariant): string[] {
  return draft.product.optionNames.length > 0
    ? variant.optionValues
    : [SHOPIFY_DEFAULT_OPTION_VALUE];
}

/** Each option with its values in first-seen order, as `productOptions` needs them. */
function toProductOptions(draft: ListingDraft): ShopifyOptionSetInput[] {
  return optionNamesOf(draft).map((name, index) => {
    const values = new Set(draft.variants.map((variant) => optionValuesOf(draft, variant)[index]));
    return {
      name,
      position: index + SHOPIFY_FIRST_POSITION,
      values: [...values].flatMap((value) => (value === undefined ? [] : [{ name: value }])),
    };
  });
}

function toOptionValues(
  draft: ListingDraft,
  variant: ListingDraftVariant,
): ShopifyOptionValueInput[] {
  const values = optionValuesOf(draft, variant);
  return optionNamesOf(draft).map((optionName, index) => ({
    optionName,
    name: values[index] ?? SHOPIFY_DEFAULT_OPTION_VALUE,
  }));
}

function toInventoryItem(variant: ListingDraftVariant): ShopifyInventoryItemInput {
  const weight = variant.weightGrams;
  return {
    tracked: variant.tracked,
    cost: variant.unitCost,
    requiresShipping: variant.requiresShipping,
    ...(weight === null
      ? {}
      : { measurement: { weight: { value: weight, unit: ShopifyWeightUnit.Grams } } }),
  };
}

/** Opening stock for a variant Shopify does not have yet; existing ones sync separately. */
function openingStock(
  variant: ListingDraftVariant,
  context: ProductSetContext,
): Pick<ShopifyVariantSetInput, 'inventoryQuantities'> {
  if (variant.externalVariantId || !context.locationId || !variant.tracked) {
    return {};
  }
  const quantity = variant.available ?? 0;
  return {
    inventoryQuantities: [
      { locationId: context.locationId, name: SHOPIFY_AVAILABLE_QUANTITY_NAME, quantity },
    ],
  };
}

function toVariantInput(
  draft: ListingDraft,
  variant: ListingDraftVariant,
  position: number,
  context: ProductSetContext,
): ShopifyVariantSetInput {
  return {
    ...(variant.externalVariantId ? { id: variant.externalVariantId } : {}),
    position,
    optionValues: toOptionValues(draft, variant),
    price: variant.price,
    compareAtPrice: variant.compareAtPrice,
    sku: variant.sku,
    ...(variant.barcode ? { barcodes: [{ value: variant.barcode }] } : {}),
    inventoryPolicy: variant.continueSellingWhenOutOfStock
      ? ShopifyInventoryPolicy.Continue
      : ShopifyInventoryPolicy.Deny,
    taxable: variant.taxable,
    inventoryItem: toInventoryItem(variant),
    ...openingStock(variant, context),
  };
}

function toFiles(draft: ListingDraft): ShopifyFileSetInput[] {
  return draft.product.images.map((image) => ({
    originalSource: image.url,
    alt: image.altText,
    contentType: ShopifyFileContentType.Image,
  }));
}

/**
 * The `productSet` input for a draft. Every variant is listed (productSet deletes the ones it
 * is not sent), positions follow the draft, and the handle is only set on create so an update
 * never changes the product's URL. Images are sent when publishing or when they changed.
 */
export function toProductSetInput(
  draft: ListingDraft,
  context: ProductSetContext,
): ShopifyProductSetInput {
  const { product } = draft;
  const sendFiles = context.creating || draft.imagesChanged !== false;
  return {
    ...(context.creating ? { handle: product.handle } : {}),
    title: product.title,
    descriptionHtml: product.descriptionHtml,
    vendor: product.vendor,
    productType: product.productType,
    tags: product.tags,
    status: product.active ? ShopifyProductStatus.Active : ShopifyProductStatus.Draft,
    productOptions: toProductOptions(draft),
    variants: draft.variants.map((variant, index) =>
      toVariantInput(draft, variant, index + SHOPIFY_FIRST_POSITION, context),
    ),
    ...(sendFiles ? { files: toFiles(draft) } : {}),
  };
}
