import { z } from 'zod';

/** Etsy's `Money`: `amount` in the currency's smallest unit, over `divisor`. */
export const etsyMoneySchema = z.object({
  amount: z.number().int(),
  divisor: z.number().int().positive(),
  currency_code: z.string(),
});

export type EtsyMoney = z.infer<typeof etsyMoneySchema>;

/** A listing as `createDraftListing`, `updateListing` and `getListing` answer it, in part. */
export const etsyListingSchema = z.object({
  listing_id: z.number().int().positive(),
  state: z.string(),
  url: z.string().nullish(),
});

export type EtsyListing = z.infer<typeof etsyListingSchema>;

const propertyValueSchema = z.object({
  property_id: z.number().int().positive(),
  property_name: z.string().nullish(),
  scale_id: z.number().int().positive().nullish(),
  value_ids: z.array(z.number().int()).default([]),
  values: z.array(z.string()).default([]),
});

const offeringSchema = z.object({
  quantity: z.number().int().nonnegative(),
  is_enabled: z.boolean(),
  is_deleted: z.boolean().default(false),
  price: etsyMoneySchema,
  readiness_state_id: z.number().int().positive().nullish(),
});

const productSchema = z.object({
  sku: z.string().nullish(),
  is_deleted: z.boolean().default(false),
  offerings: z.array(offeringSchema).default([]),
  property_values: z.array(propertyValueSchema).default([]),
});

/** `getListingInventory` and `updateListingInventory`'s answer. */
export const etsyInventorySchema = z.object({
  products: z.array(productSchema),
  price_on_property: z.array(z.number().int()).default([]),
  quantity_on_property: z.array(z.number().int()).default([]),
  sku_on_property: z.array(z.number().int()).default([]),
  readiness_state_on_property: z.array(z.number().int()).nullish(),
});

export type EtsyInventory = z.infer<typeof etsyInventorySchema>;
export type EtsyInventoryProduct = z.infer<typeof productSchema>;
export type EtsyInventoryPropertyValue = z.infer<typeof propertyValueSchema>;

/** One way to buy a product: its price, stock and processing profile. */
export interface EtsyOfferingInput {
  price: number;
  quantity: number;
  is_enabled: boolean;
  readiness_state_id: number | null;
}

export interface EtsyPropertyValueInput {
  property_id: number;
  property_name?: string;
  scale_id?: number;
  value_ids: number[];
  values: string[];
}

export interface EtsyProductInput {
  sku: string;
  property_values: EtsyPropertyValueInput[];
  offerings: EtsyOfferingInput[];
}

/** `updateListingInventory`'s body: every product of the listing, which replaces them all. */
export interface EtsyInventoryInput {
  products: EtsyProductInput[];
  price_on_property: number[];
  quantity_on_property: number[];
  sku_on_property: number[];
  readiness_state_on_property: number[];
}

/** `getListingImages`. */
export const etsyListingImagesSchema = z.object({
  results: z.array(
    z.object({
      listing_image_id: z.number().int().positive(),
      rank: z.number().int().nonnegative(),
    }),
  ),
});

/** `uploadListingImage`'s answer, in part. */
export const etsyUploadedImageSchema = z.object({
  listing_image_id: z.number().int().positive(),
});
