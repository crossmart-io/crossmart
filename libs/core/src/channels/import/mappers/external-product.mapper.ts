import type { ExternalProduct, ExternalVariant } from '@crossmart/connectors';
import { ListingStatus, OutOfStockPolicy, ProductStatus } from '@crossmart/database';
import type { ProductDraft, VariantDraft } from '../../../catalog/entities/product-draft.js';
import { MAX_STOCK_QUANTITY } from '../../../inventory/inventory.constants.js';

/**
 * A channel variant as a new catalog variant. It starts with no stock: the import then sets
 * its stock through the inventory ledger, so the movement records the import and its author.
 */
function toVariantDraft(variant: ExternalVariant): VariantDraft {
  return {
    sku: variant.sku ?? undefined,
    barcode: variant.barcode ?? undefined,
    optionValues: variant.optionValues,
    price: variant.price,
    compareAtPrice: variant.compareAtPrice ?? undefined,
    cost: variant.unitCost ?? undefined,
    weightGrams: variant.weightGrams ?? undefined,
    requiresShipping: variant.requiresShipping,
    taxable: variant.taxable,
    outOfStockPolicy: variant.continueSellingWhenOutOfStock
      ? OutOfStockPolicy.CONTINUE_SELLING
      : OutOfStockPolicy.STOP_SELLING,
    inventory: { tracked: variant.tracked, quantity: 0 },
  };
}

/** A channel product as a new catalog product: active when it is for sale, else a draft. */
export function toProductDraft(product: ExternalProduct): ProductDraft {
  return {
    handle: product.handle,
    title: product.title,
    descriptionHtml: product.descriptionHtml,
    vendor: product.vendor ?? undefined,
    productType: product.productType ?? undefined,
    tags: product.tags,
    status: product.active ? ProductStatus.ACTIVE : ProductStatus.DRAFT,
    optionNames: product.optionNames,
    variants: product.variants.map((variant) => toVariantDraft(variant)),
    media: product.images.map((image) => ({
      url: image.url,
      altText: image.altText ?? undefined,
    })),
  };
}

/** Live on the channel, or there but not for sale (a draft or archived product). */
export function toListingStatus(product: ExternalProduct): ListingStatus {
  return product.active ? ListingStatus.ACTIVE : ListingStatus.INACTIVE;
}

/**
 * The stock a tracked channel variant brings, kept within what Crossmart stores. Oversold
 * variants (negative on the channel) start at zero.
 */
export function toImportedStock(variant: ExternalVariant): number | null {
  if (!variant.tracked || variant.available === null) {
    return null;
  }
  return Math.min(Math.max(variant.available, 0), MAX_STOCK_QUANTITY);
}
