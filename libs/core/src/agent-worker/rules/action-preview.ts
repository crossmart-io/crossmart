import { z } from 'zod';
import { AGENT_WORKER_PREVIEW_VALUE_MAX_LENGTH } from '../agent-worker.constants.js';
import type { AgentWorkerChange } from '../entities/agent-worker-views.js';
import { displayValue } from './action-outcome.js';
import { truncateWithNote } from './truncate-text.js';

/** The parts of a listing (`get_listing`) a preview reads; the rest is ignored. */
const INHERITED = z.object({ product: z.unknown(), effective: z.unknown() });
export const LISTING_PREVIEW_SOURCE = z.object({
  connection: z.object({ displayName: z.string() }),
  title: INHERITED,
  descriptionHtml: INHERITED,
  vendor: INHERITED,
  tags: INHERITED,
  images: INHERITED,
  visibility: INHERITED,
  stock: z.object({ inventoryBuffer: z.unknown(), maxQuantity: z.unknown() }),
  variants: z.array(
    z.object({
      variantId: z.string(),
      title: z.string(),
      price: INHERITED,
      compareAtPrice: INHERITED,
      rulePrice: z.string(),
    }),
  ),
});
export type ListingPreviewSource = z.infer<typeof LISTING_PREVIEW_SOURCE>;

/** The parts of a product (`get_product`) a preview reads. */
export const PRODUCT_PREVIEW_SOURCE = z.object({
  title: z.string(),
  descriptionHtml: z.string(),
  vendor: z.string().nullable(),
  productType: z.string().nullable(),
  tags: z.array(z.string()),
  status: z.string(),
  variants: z.array(z.object({ id: z.string(), sku: z.string().nullable(), price: z.string() })),
});
export type ProductPreviewSource = z.infer<typeof PRODUCT_PREVIEW_SOURCE>;

type ListingField = 'title' | 'descriptionHtml' | 'vendor' | 'tags' | 'visibility' | 'images';

/** `update_listing` inputs and the listing field each one overrides. */
const LISTING_FIELDS: Readonly<Record<string, ListingField>> = {
  title: 'title',
  descriptionHtml: 'descriptionHtml',
  vendor: 'vendor',
  tags: 'tags',
  visibility: 'visibility',
  mediaUrls: 'images',
};
const STOCK_FIELDS = ['inventoryBuffer', 'maxQuantity'] as const;
const PRODUCT_FIELDS = [
  'title',
  'descriptionHtml',
  'vendor',
  'productType',
  'tags',
  'status',
] as const;
const VARIANT_PRICES_INPUT = 'variantPrices';
const ID_SUFFIX = 'Id';
/** Previews name price changes `price (<variant>)`. */
export const PRICE_LABEL = 'price';

function shown(value: unknown): string | null {
  const text = displayValue(value);
  return text === null ? null : truncateWithNote(text, AGENT_WORKER_PREVIEW_VALUE_MAX_LENGTH);
}

function change(field: string, before: unknown, after: unknown): AgentWorkerChange[] {
  const [from, to] = [shown(before), shown(after)];
  return from === to ? [] : [{ field, before: from, after: to }];
}

const VARIANT_PRICE = z.object({ variantId: z.string(), price: z.string().nullable() });

function variantPriceChanges(source: ListingPreviewSource, input: unknown): AgentWorkerChange[] {
  const prices = z.array(VARIANT_PRICE).safeParse(input);
  if (!prices.success) return [];
  return prices.data.flatMap(({ variantId, price }) => {
    const variant = source.variants.find((candidate) => candidate.variantId === variantId);
    if (!variant) return [];
    const label = `${PRICE_LABEL} (${variant.title})`;
    return change(label, variant.price.effective, price ?? variant.rulePrice);
  });
}

/** What `update_listing` would change on one store; null reverts a field to the product's. */
export function listingChanges(
  source: ListingPreviewSource,
  input: Record<string, unknown>,
): AgentWorkerChange[] {
  const fields = Object.entries(LISTING_FIELDS).flatMap(([inputKey, field]) => {
    if (input[inputKey] === undefined) return [];
    const after = input[inputKey] ?? source[field].product;
    return change(inputKey, source[field].effective, after);
  });
  const stock = STOCK_FIELDS.flatMap((field) =>
    input[field] === undefined ? [] : change(field, source.stock[field], input[field]),
  );
  return [...fields, ...stock, ...variantPriceChanges(source, input[VARIANT_PRICES_INPUT])];
}

const SAVED_VARIANT = z.object({
  id: z.string().optional(),
  sku: z.string().optional(),
  price: z.string(),
});

function productVariantChanges(source: ProductPreviewSource, input: unknown): AgentWorkerChange[] {
  const variants = z.array(SAVED_VARIANT).safeParse(input);
  if (!variants.success) return [];
  return variants.data.flatMap((variant) => {
    const current = source.variants.find((candidate) => candidate.id === variant.id);
    const label = `${PRICE_LABEL} (${variant.sku ?? current?.sku ?? variant.id ?? 'new variant'})`;
    return change(label, current?.price ?? null, variant.price);
  });
}

/** What `replace_product` would change in the catalog. */
export function productChanges(
  source: ProductPreviewSource,
  input: Record<string, unknown>,
): AgentWorkerChange[] {
  const fields = PRODUCT_FIELDS.flatMap((field) =>
    input[field] === undefined ? [] : change(field, source[field], input[field]),
  );
  return [...fields, ...productVariantChanges(source, input.variants)];
}

/** For tools without a reader: the values the call sets, ids aside. */
export function inputChanges(input: Record<string, unknown>): AgentWorkerChange[] {
  return Object.entries(input)
    .filter(([field]) => !field.endsWith(ID_SUFFIX))
    .flatMap(([field, value]) => change(field, null, value));
}
