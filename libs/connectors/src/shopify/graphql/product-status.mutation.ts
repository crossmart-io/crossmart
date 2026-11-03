import { z } from 'zod';
import type { ShopifyProductStatus } from './product-set.mutation.js';
import type { ShopifyOperation } from './shopify-operation.js';
import { shopifyUserErrorsSchema } from './shopify-user-error.js';

export interface ProductStatusVariables {
  product: { id: string; status: ShopifyProductStatus };
}

const productStatusDataSchema = z.object({
  productUpdate: z.object({ userErrors: shopifyUserErrorsSchema }),
});

/** Changes only a product's status, such as archiving it when it is delisted. */
export const PRODUCT_STATUS_MUTATION: ShopifyOperation<
  z.infer<typeof productStatusDataSchema>,
  ProductStatusVariables
> = {
  name: 'ProductStatusUpdate',
  document: /* GraphQL */ `
    mutation ProductStatusUpdate($product: ProductUpdateInput!) {
      productUpdate(product: $product) {
        userErrors {
          field
          message
        }
      }
    }
  `,
  schema: productStatusDataSchema,
};
