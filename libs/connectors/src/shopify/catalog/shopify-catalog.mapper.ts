import type {
  ExternalImage,
  ExternalProduct,
  ExternalVariant,
} from '../../sdk/capabilities/catalog.types.js';
import {
  SHOPIFY_AVAILABLE_QUANTITY,
  type ShopifyCatalogVariant,
  ShopifyInventoryPolicy,
  ShopifyWeightUnit,
} from '../graphql/catalog-variant.fragment.js';
import {
  type ShopifyCatalogProduct,
  ShopifyProductStatus,
} from '../graphql/catalog-products.query.js';
import {
  GRAMS_PER_KILOGRAM,
  GRAMS_PER_OUNCE,
  GRAMS_PER_POUND,
  SHOPIFY_DEFAULT_OPTION_NAME,
} from '../shopify.constants.js';

const GRAMS_PER_UNIT: Record<ShopifyWeightUnit, number> = {
  [ShopifyWeightUnit.Grams]: 1,
  [ShopifyWeightUnit.Kilograms]: GRAMS_PER_KILOGRAM,
  [ShopifyWeightUnit.Ounces]: GRAMS_PER_OUNCE,
  [ShopifyWeightUnit.Pounds]: GRAMS_PER_POUND,
};

/** Product options in Shopify's order, without the "Title" placeholder of option-less products. */
function optionNamesOf(product: ShopifyCatalogProduct): string[] {
  if (product.hasOnlyDefaultVariant) {
    return [];
  }
  return [...product.options]
    .sort((left, right) => left.position - right.position)
    .map((option) => option.name)
    .filter((name) => !(product.options.length === 1 && name === SHOPIFY_DEFAULT_OPTION_NAME));
}

function weightInGrams(variant: ShopifyCatalogVariant): number | null {
  const weight = variant.inventoryItem.measurement.weight;
  if (!weight || weight.value <= 0) {
    return null;
  }
  return Math.round(weight.value * GRAMS_PER_UNIT[weight.unit]);
}

/** Units available at the location the query read; null when stock is not tracked there. */
function availableOf(variant: ShopifyCatalogVariant): number | null {
  const { tracked, inventoryLevel } = variant.inventoryItem;
  if (!tracked || !inventoryLevel) {
    return null;
  }
  const available = inventoryLevel.quantities.find(
    (quantity) => quantity.name === SHOPIFY_AVAILABLE_QUANTITY,
  );
  return available?.quantity ?? null;
}

/** One value per option name, in the product's option order. */
function optionValuesOf(variant: ShopifyCatalogVariant, optionNames: string[]): string[] {
  const valueByName = new Map(variant.selectedOptions.map(({ name, value }) => [name, value]));
  return optionNames.map((name) => valueByName.get(name) ?? '');
}

export function toExternalVariant(
  variant: ShopifyCatalogVariant,
  optionNames: string[],
): ExternalVariant {
  const { inventoryItem } = variant;
  return {
    externalId: variant.id,
    externalInventoryId: inventoryItem.id,
    sku: variant.sku || null,
    barcode: variant.barcode || null,
    optionValues: optionValuesOf(variant, optionNames),
    price: variant.price,
    compareAtPrice: variant.compareAtPrice,
    tracked: inventoryItem.tracked,
    available: availableOf(variant),
    weightGrams: weightInGrams(variant),
    requiresShipping: inventoryItem.requiresShipping,
    taxable: variant.taxable,
    continueSellingWhenOutOfStock: variant.inventoryPolicy === ShopifyInventoryPolicy.Continue,
    unitCost: inventoryItem.unitCost?.amount ?? null,
  };
}

function imagesOf(product: ShopifyCatalogProduct): ExternalImage[] {
  return product.media.nodes.flatMap((media) =>
    media.image ? [{ url: media.image.url, altText: media.image.altText }] : [],
  );
}

/** A Shopify product in Crossmart's terms. `variants` holds every variant, all pages read. */
export function toExternalProduct(
  product: ShopifyCatalogProduct,
  variants: ShopifyCatalogVariant[],
): ExternalProduct {
  const optionNames = optionNamesOf(product);
  return {
    externalId: product.id,
    handle: product.handle,
    title: product.title,
    descriptionHtml: product.descriptionHtml,
    vendor: product.vendor || null,
    productType: product.productType || null,
    tags: product.tags,
    active: product.status === ShopifyProductStatus.Active,
    optionNames,
    variants: variants.map((variant) => toExternalVariant(variant, optionNames)),
    images: imagesOf(product),
    externalUrl: product.onlineStoreUrl,
  };
}
