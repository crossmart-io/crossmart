import { z } from 'zod';

/** Units of `Weight.unit` in the Admin API. */
export enum ShopifyWeightUnit {
  Grams = 'GRAMS',
  Kilograms = 'KILOGRAMS',
  Ounces = 'OUNCES',
  Pounds = 'POUNDS',
}

/** `ProductVariant.inventoryPolicy`: whether the variant sells once it is out of stock. */
export enum ShopifyInventoryPolicy {
  Deny = 'DENY',
  Continue = 'CONTINUE',
}

/** The inventory state Crossmart reads: units that can be sold. */
export const SHOPIFY_AVAILABLE_QUANTITY = 'available';

const pageInfoSchema = z.object({
  hasNextPage: z.boolean(),
  endCursor: z.string().nullable(),
});

const inventoryItemSchema = z.object({
  id: z.string(),
  tracked: z.boolean(),
  requiresShipping: z.boolean(),
  unitCost: z.object({ amount: z.string() }).nullable(),
  measurement: z.object({
    weight: z.object({ unit: z.enum(ShopifyWeightUnit), value: z.number() }).nullable(),
  }),
  /** Null when the item is not stocked at the location. */
  inventoryLevel: z
    .object({ quantities: z.array(z.object({ name: z.string(), quantity: z.number() })) })
    .nullable(),
});

export const catalogVariantSchema = z.object({
  id: z.string(),
  sku: z.string().nullable(),
  barcode: z.string().nullable(),
  price: z.string(),
  compareAtPrice: z.string().nullable(),
  taxable: z.boolean(),
  inventoryPolicy: z.enum(ShopifyInventoryPolicy),
  selectedOptions: z.array(z.object({ name: z.string(), value: z.string() })),
  inventoryItem: inventoryItemSchema,
});

export const catalogVariantConnectionSchema = z.object({
  pageInfo: pageInfoSchema,
  nodes: z.array(catalogVariantSchema),
});

export type ShopifyCatalogVariant = z.infer<typeof catalogVariantSchema>;
export type ShopifyPageInfo = z.infer<typeof pageInfoSchema>;
export { pageInfoSchema };

/**
 * The variant fields an import reads, shared by the products page and the follow-up variant
 * pages. It uses the operation's `$locationId` to read stock at the primary location only.
 */
export const CATALOG_VARIANT_FRAGMENT = /* GraphQL */ `
  fragment CatalogVariant on ProductVariant {
    id
    sku
    barcode
    price
    compareAtPrice
    taxable
    inventoryPolicy
    selectedOptions {
      name
      value
    }
    inventoryItem {
      id
      tracked
      requiresShipping
      unitCost {
        amount
      }
      measurement {
        weight {
          unit
          value
        }
      }
      inventoryLevel(locationId: $locationId) {
        quantities(names: ["${SHOPIFY_AVAILABLE_QUANTITY}"]) {
          name
          quantity
        }
      }
    }
  }
`;
