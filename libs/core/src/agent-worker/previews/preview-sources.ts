import { z } from 'zod';

/** What previews read from the API. Each schema names only the fields a preview uses. */
const INHERITED = z.object({ product: z.unknown(), effective: z.unknown() });

export const PRODUCT_SOURCE = z.object({
  title: z.string(),
  descriptionHtml: z.string(),
  vendor: z.string().nullable(),
  productType: z.string().nullable(),
  tags: z.array(z.string()),
  status: z.string(),
  variants: z.array(
    z.object({
      id: z.string(),
      sku: z.string().nullable(),
      optionValues: z.array(z.string()),
      price: z.string(),
    }),
  ),
});
export type ProductSource = z.infer<typeof PRODUCT_SOURCE>;

/** A store; its currency sits in the settings of its channel. */
const CHANNEL_CURRENCY = z.object({ currencyCode: z.string() }).nullable().optional();
export const STORE_SOURCE = z.object({
  displayName: z.string(),
  shopify: CHANNEL_CURRENCY,
  ebay: CHANNEL_CURRENCY,
  etsy: CHANNEL_CURRENCY,
  googleMerchant: CHANNEL_CURRENCY,
});
export type StoreSource = z.infer<typeof STORE_SOURCE>;

export const LISTING_SOURCE = z.object({
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
export type ListingSource = z.infer<typeof LISTING_SOURCE>;

export const INVENTORY_ITEM_SOURCE = z.object({
  productTitle: z.string(),
  sku: z.string().nullable(),
  optionValues: z.array(z.string()),
  onHand: z.number(),
});
export type InventoryItemSource = z.infer<typeof INVENTORY_ITEM_SOURCE>;

export const WORKSPACE_SOURCE = z.object({ currency: z.string() });
