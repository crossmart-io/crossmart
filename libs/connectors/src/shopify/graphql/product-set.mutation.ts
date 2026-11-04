import { z } from 'zod';
import type { ShopifyOperation } from './shopify-operation.js';
import { shopifyUserErrorsSchema } from './shopify-user-error.js';

/** Product statuses Crossmart writes. */
export enum ShopifyProductStatus {
  Active = 'ACTIVE',
  Draft = 'DRAFT',
  Archived = 'ARCHIVED',
}

export enum ShopifyInventoryPolicy {
  Deny = 'DENY',
  Continue = 'CONTINUE',
}

export enum ShopifyFileContentType {
  Image = 'IMAGE',
}

export enum ShopifyWeightUnit {
  Grams = 'GRAMS',
}

export interface ShopifyOptionValueInput {
  optionName: string;
  name: string;
}

export interface ShopifyInventoryQuantityInput {
  locationId: string;
  name: string;
  quantity: number;
}

export interface ShopifyInventoryItemInput {
  tracked: boolean;
  cost: string | null;
  requiresShipping: boolean;
  measurement?: { weight: { value: number; unit: ShopifyWeightUnit } };
}

/** `ProductVariantSetInput`, as far as Crossmart fills it in. */
export interface ShopifyVariantSetInput {
  id?: string;
  position: number;
  optionValues: ShopifyOptionValueInput[];
  price: string;
  compareAtPrice: string | null;
  sku: string | null;
  barcodes?: { value: string }[];
  inventoryPolicy: ShopifyInventoryPolicy;
  taxable: boolean;
  inventoryItem: ShopifyInventoryItemInput;
  inventoryQuantities?: ShopifyInventoryQuantityInput[];
}

export interface ShopifyOptionSetInput {
  name: string;
  position: number;
  values: { name: string }[];
}

export interface ShopifyFileSetInput {
  originalSource: string;
  alt: string | null;
  contentType: ShopifyFileContentType;
}

/** `ProductSetInput`, as far as Crossmart fills it in. */
export interface ShopifyProductSetInput {
  handle?: string;
  title: string;
  descriptionHtml: string;
  vendor: string | null;
  productType: string | null;
  tags: string[];
  status: ShopifyProductStatus;
  productOptions: ShopifyOptionSetInput[];
  variants: ShopifyVariantSetInput[];
  files?: ShopifyFileSetInput[];
}

export interface ProductSetVariables {
  identifier?: { id: string };
  input: ShopifyProductSetInput;
}

const productSetDataSchema = z.object({
  productSet: z.object({
    product: z
      .object({
        id: z.string(),
        status: z.string(),
        onlineStoreUrl: z.string().nullable(),
        variants: z.object({
          nodes: z.array(
            z.object({
              id: z.string(),
              position: z.number(),
              inventoryItem: z.object({ id: z.string() }).nullable(),
            }),
          ),
        }),
      })
      .nullable(),
    userErrors: shopifyUserErrorsSchema,
  }),
});

export type ProductSetData = z.infer<typeof productSetDataSchema>;

/**
 * Creates or replaces a product with its options, variants and images, synchronously.
 * Variants left out of the input are deleted, so the input always lists every variant.
 */
export const PRODUCT_SET_MUTATION: ShopifyOperation<ProductSetData, ProductSetVariables> = {
  name: 'ProductSet',
  document: /* GraphQL */ `
    mutation ProductSet($identifier: ProductSetIdentifiers, $input: ProductSetInput!) {
      productSet(identifier: $identifier, input: $input, synchronous: true) {
        product {
          id
          status
          onlineStoreUrl
          variants(first: 250) {
            nodes {
              id
              position
              inventoryItem {
                id
              }
            }
          }
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `,
  schema: productSetDataSchema,
};
