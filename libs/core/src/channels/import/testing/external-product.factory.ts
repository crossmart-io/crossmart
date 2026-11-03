import type { ExternalProduct, ExternalVariant } from '@crossmart/connectors';

/** A tracked channel variant with stock, for import tests. */
export function externalVariant(
  externalId: string,
  overrides: Partial<ExternalVariant> = {},
): ExternalVariant {
  return {
    externalId,
    externalInventoryId: `${externalId}-inventory`,
    sku: null,
    barcode: null,
    optionValues: [],
    price: '10.00',
    compareAtPrice: null,
    tracked: true,
    available: 5,
    weightGrams: null,
    requiresShipping: true,
    taxable: true,
    continueSellingWhenOutOfStock: false,
    unitCost: null,
    ...overrides,
  };
}

/** An active channel product without options and with one variant per SKU given. */
export function externalProduct(
  handle: string,
  skus: (string | null)[] = [null],
  overrides: Partial<ExternalProduct> = {},
): ExternalProduct {
  const optionNames = skus.length > 1 ? ['Size'] : [];
  return {
    externalId: `gid://shopify/Product/${handle}`,
    handle,
    title: `Title of ${handle}`,
    descriptionHtml: '<p>Hand made.</p>',
    vendor: 'Northfield Goods',
    productType: null,
    tags: ['imported'],
    active: true,
    optionNames,
    variants: skus.map((sku, index) =>
      externalVariant(`gid://shopify/ProductVariant/${handle}-${index}`, {
        sku,
        optionValues: optionNames.length > 0 ? [`Size ${index}`] : [],
      }),
    ),
    images: [{ url: `https://cdn.shopify.com/${handle}.jpg`, altText: null }],
    externalUrl: null,
    ...overrides,
  };
}
