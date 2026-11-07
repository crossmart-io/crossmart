import { InventoryMovementReason } from '@crossmart/database/generated/prisma/enums.js';

/** How a stock adjustment's reason reads on an approval card: "Add 20 units (stock received)". */
export const STOCK_REASON_PHRASES: Readonly<Partial<Record<InventoryMovementReason, string>>> = {
  [InventoryMovementReason.RECEIVED]: 'stock received',
  [InventoryMovementReason.CORRECTION]: 'count correction',
  [InventoryMovementReason.RETURNED]: 'returned by a buyer',
  [InventoryMovementReason.DAMAGED]: 'damaged',
  [InventoryMovementReason.LOST]: 'lost',
  [InventoryMovementReason.SOLD]: 'sold outside your stores',
};

/** Labels of the values an approval card shows. */
export const PREVIEW_LABELS = {
  title: 'Title',
  description: 'Description',
  vendor: 'Brand',
  productType: 'Product type',
  tags: 'Tags',
  status: 'Status',
  images: 'Images',
  visibility: 'Visibility',
  onHand: 'On hand',
  heldBack: 'Units held back',
  maxShown: 'Most units shown',
  category: 'Category',
} as const;

/** Prices are labelled `Price (<variant>)`; risk checks look for this prefix. */
export const PRICE_LABEL = 'Price';
export const COMPARE_AT_PRICE_LABEL = 'Compare-at price';
/** A variant named by neither SKU nor options. */
export const NEW_VARIANT_NAME = 'new variant';
export const DEFAULT_VARIANT_NAME = 'default';
export const OPTION_SEPARATOR = ' / ';
export const LIST_SEPARATOR = ', ';
/** Shown for a value that is cleared, such as tags removed or a field reverted to nothing. */
export const NONE = 'none';
/** A field reverted to the catalog's value on one store. */
export const FROM_CATALOG_SUFFIX = ' (from the catalog)';
export const NOTE_PREFIX = 'Note: ';
export const REMOVED_ASPECT = 'removed';

export const PREVIEW_HEADLINES = {
  productText: (fields: string): string => `Edit the ${fields} in the catalog`,
  replaceProduct: 'Save the whole product as proposed: fields and variants left out are removed',
  createProduct: (variants: number, status: string): string =>
    `Create a new product with ${variants} ${variants === 1 ? 'variant' : 'variants'} (${status})`,
  updateListing: (store: string): string =>
    `Change how this product shows on ${store} only; the catalog stays as it is`,
  addToStore: 'Publish this product to the store and keep it in sync',
  removeFromStore:
    'Take this product off the store (it is archived there and keeps its order history)',
  retryListing: 'Publish this listing to the store again',
  setCategory: (name: string): string => `Set the store category to ${name}`,
  autoCategory: 'Clear the store category, so the next publish picks the best match',
  itemSpecifics: (count: number): string =>
    `Replace the item specifics with ${count} ${count === 1 ? 'aspect' : 'aspects'}`,
  generateContent: (count: number, store: string): string =>
    `Write AI titles and descriptions for ${count} ${count === 1 ? 'product' : 'products'} on ${store}; they arrive as suggestions to review`,
  approveSuggestion: 'Apply an AI suggestion to its listing',
  variantPrice: (variant: string): string => `Change the catalog price of ${variant}`,
  addStock: (units: number, reason: string): string =>
    `Add ${units} ${units === 1 ? 'unit' : 'units'} (${reason})`,
  removeStock: (units: number, reason: string): string =>
    `Remove ${units} ${units === 1 ? 'unit' : 'units'} (${reason})`,
  setStock: (units: number, reason: string): string => `Set stock to ${units} (${reason})`,
} as const;

/** "title", "description", "title and description". */
export const FIELD_JOINER = ' and ';
export const ON_STORE = ' on ';
