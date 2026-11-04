import { z } from 'zod';
import type { ShopifyOperation } from './shopify-operation.js';
import { shopifyUserErrorsSchema } from './shopify-user-error.js';

export interface VariantPricesVariables {
  productId: string;
  variants: { id: string; price: string; compareAtPrice: string | null }[];
}

const variantPricesDataSchema = z.object({
  productVariantsBulkUpdate: z.object({ userErrors: shopifyUserErrorsSchema }),
});

/** Sets the prices of some of one product's variants, leaving everything else as it is. */
export const VARIANT_PRICES_MUTATION: ShopifyOperation<
  z.infer<typeof variantPricesDataSchema>,
  VariantPricesVariables
> = {
  name: 'VariantPricesUpdate',
  document: /* GraphQL */ `
    mutation VariantPricesUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        userErrors {
          field
          message
        }
      }
    }
  `,
  schema: variantPricesDataSchema,
};
