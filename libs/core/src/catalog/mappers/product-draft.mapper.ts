import type { MediaDraft, ProductDraft, VariantDraft } from '../entities/product-draft.js';
import type { ProductUpdateTargetRecord } from '../repositories/product.queries.js';
import { toAmount } from './decimal-amount.mapper.js';

type TargetVariant = ProductUpdateTargetRecord['variants'][number];
type TargetMedia = ProductUpdateTargetRecord['media'][number];

/** A catalog product as a draft that, written back unchanged, changes nothing. */
export function toProductDraft(record: ProductUpdateTargetRecord): ProductDraft {
  return {
    handle: record.handle,
    title: record.title,
    descriptionHtml: record.descriptionHtml,
    vendor: record.vendor ?? undefined,
    productType: record.productType ?? undefined,
    tags: record.tags,
    status: record.status,
    condition: record.condition,
    optionNames: record.optionNames,
    variants: record.variants.map(toVariantDraft),
    media: record.media.map(toMediaDraft),
  };
}

function toVariantDraft(variant: TargetVariant): VariantDraft {
  return {
    id: variant.id,
    sku: variant.sku ?? undefined,
    barcode: variant.barcode ?? undefined,
    optionValues: variant.optionValues,
    price: toAmount(variant.price),
    compareAtPrice: variant.compareAtPrice ? toAmount(variant.compareAtPrice) : undefined,
    cost: variant.cost ? toAmount(variant.cost) : undefined,
    weightGrams: variant.weightGrams ?? undefined,
    requiresShipping: variant.requiresShipping,
    taxable: variant.taxable,
    outOfStockPolicy: variant.outOfStockPolicy,
    inventory: {
      tracked: variant.inventoryItem?.tracked ?? false,
      quantity: variant.inventoryItem?.available ?? 0,
    },
  };
}

function toMediaDraft(media: TargetMedia): MediaDraft {
  return { url: media.url, altText: media.altText ?? undefined };
}
