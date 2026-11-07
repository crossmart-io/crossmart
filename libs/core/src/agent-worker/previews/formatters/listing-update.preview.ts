import { z } from 'zod';
import { AgentToolName } from '../../../agent-tools/agent-tools.constants.js';
import type {
  AgentWorkerActionPreview,
  AgentWorkerChange,
} from '../../entities/agent-worker-views.js';
import type { ActionPreviewFormatter } from '../action-preview-formatter.js';
import {
  COMPARE_AT_PRICE_LABEL,
  FROM_CATALOG_SUFFIX,
  ON_STORE,
  PREVIEW_HEADLINES,
  PREVIEW_LABELS,
} from '../preview.constants.js';
import type { PreviewReader } from '../preview-reader.js';
import type { ListingSource } from '../preview-sources.js';
import { change, money, priceLabel } from '../preview-values.js';

const VARIANT_PRICE = z.object({
  variantId: z.string(),
  price: z.string().nullable(),
  compareAtPrice: z.string().nullable(),
});
const INPUT = z.object({
  productId: z.string(),
  connectionId: z.string(),
  variantPrices: z.array(VARIANT_PRICE).optional(),
  inventoryBuffer: z.number().nullable().optional(),
  maxQuantity: z.number().nullable().optional(),
});
type ListingUpdate = z.infer<typeof INPUT>;

type InheritedField = 'title' | 'descriptionHtml' | 'vendor' | 'tags' | 'visibility' | 'images';

/** `update_listing` inputs that override an inherited field, with the field and its label. */
const INHERITED_FIELDS: readonly (readonly [string, InheritedField, string])[] = [
  ['title', 'title', PREVIEW_LABELS.title],
  ['descriptionHtml', 'descriptionHtml', PREVIEW_LABELS.description],
  ['vendor', 'vendor', PREVIEW_LABELS.vendor],
  ['tags', 'tags', PREVIEW_LABELS.tags],
  ['visibility', 'visibility', PREVIEW_LABELS.visibility],
  ['mediaUrls', 'images', PREVIEW_LABELS.images],
];
const STOCK_FIELDS = [
  ['inventoryBuffer', PREVIEW_LABELS.heldBack],
  ['maxQuantity', PREVIEW_LABELS.maxShown],
] as const;

/** A field set to null goes back to the catalog's value. */
function inheritedChanges(
  listing: ListingSource,
  input: Record<string, unknown>,
): AgentWorkerChange[] {
  return INHERITED_FIELDS.flatMap(([inputKey, field, label]) => {
    const value = input[inputKey];
    if (value === undefined) return [];
    const reverts = value === null;
    const labelled = reverts ? `${label}${FROM_CATALOG_SUFFIX}` : label;
    return change(labelled, listing[field].effective, reverts ? listing[field].product : value);
  });
}

function stockChanges(listing: ListingSource, update: ListingUpdate): AgentWorkerChange[] {
  return STOCK_FIELDS.flatMap(([field, label]) =>
    update[field] === undefined ? [] : change(label, listing.stock[field], update[field]),
  );
}

/** A price set to null follows the store's pricing rule again. */
function priceChanges(
  listing: ListingSource,
  update: ListingUpdate,
  currency: string,
): AgentWorkerChange[] {
  return (update.variantPrices ?? []).flatMap(({ variantId, price, compareAtPrice }) => {
    const variant = listing.variants.find((candidate) => candidate.variantId === variantId);
    if (!variant) return [];
    return [
      ...change(
        priceLabel(variant.title),
        money(variant.price.effective, currency),
        money(price ?? variant.rulePrice, currency),
      ),
      ...change(
        `${COMPARE_AT_PRICE_LABEL} (${variant.title})`,
        money(variant.compareAtPrice.effective, currency),
        money(compareAtPrice, currency),
      ),
    ];
  });
}

/** `update_listing`: what one store shows, field by field, with prices in the store's currency. */
export class ListingUpdatePreview implements ActionPreviewFormatter {
  readonly tool = AgentToolName.UpdateListing;

  async preview(
    input: Record<string, unknown>,
    reader: PreviewReader,
  ): Promise<AgentWorkerActionPreview> {
    const update = INPUT.parse(input);
    const [listing, store, product, currency] = await Promise.all([
      reader.listing(update.productId, update.connectionId),
      reader.store(update.connectionId),
      reader.product(update.productId),
      reader.storeCurrency(update.connectionId),
    ]);
    return {
      target: `${product.title}${ON_STORE}${store.displayName}`,
      headline: PREVIEW_HEADLINES.updateListing(store.displayName),
      details: [],
      changes: [
        ...inheritedChanges(listing, input),
        ...stockChanges(listing, update),
        ...priceChanges(listing, update, currency),
      ],
    };
  }
}
