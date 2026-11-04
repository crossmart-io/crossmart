import { z } from 'zod';
import {
  CATALOG_VARIANT_FRAGMENT,
  catalogVariantConnectionSchema,
} from './catalog-variant.fragment.js';
import type { ShopifyOperation } from './shopify-operation.js';

const productVariantsSchema = z.object({
  product: z.object({ variants: catalogVariantConnectionSchema }).nullable(),
});

export type ProductVariantsData = z.infer<typeof productVariantsSchema>;

export interface ProductVariantsVariables {
  productId: string;
  first: number;
  after: string;
  locationId: string;
}

/** The rest of a product's variants, for products with more than the products page reads. */
export const PRODUCT_VARIANTS_QUERY: ShopifyOperation<
  ProductVariantsData,
  ProductVariantsVariables
> = {
  name: 'ProductVariants',
  document: /* GraphQL */ `
    query ProductVariants($productId: ID!, $first: Int!, $after: String!, $locationId: ID!) {
      product(id: $productId) {
        variants(first: $first, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            ...CatalogVariant
          }
        }
      }
    }
    ${CATALOG_VARIANT_FRAGMENT}
  `,
  schema: productVariantsSchema,
};
