import { z } from 'zod';
import {
  CATALOG_VARIANT_FRAGMENT,
  catalogVariantConnectionSchema,
  pageInfoSchema,
} from './catalog-variant.fragment.js';
import type { ShopifyOperation } from './shopify-operation.js';

/** `Product.status` in the Admin API. */
export enum ShopifyProductStatus {
  Active = 'ACTIVE',
  Draft = 'DRAFT',
  Archived = 'ARCHIVED',
  Unlisted = 'UNLISTED',
}

const imageSchema = z.object({ url: z.string(), altText: z.string().nullable() });

const catalogProductSchema = z.object({
  id: z.string(),
  handle: z.string(),
  title: z.string(),
  descriptionHtml: z.string(),
  vendor: z.string().nullable(),
  productType: z.string().nullable(),
  tags: z.array(z.string()),
  status: z.enum(ShopifyProductStatus),
  onlineStoreUrl: z.string().nullable(),
  /** True for a product without options: one variant named "Default Title". */
  hasOnlyDefaultVariant: z.boolean(),
  options: z.array(z.object({ name: z.string(), position: z.number() })),
  /** Media that is not an image (video, 3D model) comes back as an empty object. */
  media: z.object({ nodes: z.array(z.object({ image: imageSchema.nullable().optional() })) }),
  variants: catalogVariantConnectionSchema,
});

const catalogProductsSchema = z.object({
  productsCount: z.object({ count: z.number() }).nullable(),
  products: z.object({ pageInfo: pageInfoSchema, nodes: z.array(catalogProductSchema) }),
});

export type ShopifyCatalogProduct = z.infer<typeof catalogProductSchema>;
export type CatalogProductsData = z.infer<typeof catalogProductsSchema>;

export interface CatalogProductsVariables {
  first: number;
  after: string | null;
  variantsFirst: number;
  mediaFirst: number;
  locationId: string;
}

/**
 * One page of products with their options, images and first variants, plus the store's
 * product count for progress. Products are read in id order, so a stored cursor stays valid
 * while the merchant edits products during a long import.
 */
export const CATALOG_PRODUCTS_QUERY: ShopifyOperation<
  CatalogProductsData,
  CatalogProductsVariables
> = {
  name: 'CatalogProducts',
  document: /* GraphQL */ `
    query CatalogProducts(
      $first: Int!
      $after: String
      $variantsFirst: Int!
      $mediaFirst: Int!
      $locationId: ID!
    ) {
      productsCount {
        count
      }
      products(first: $first, after: $after, sortKey: ID) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          handle
          title
          descriptionHtml
          vendor
          productType
          tags
          status
          onlineStoreUrl
          hasOnlyDefaultVariant
          options {
            name
            position
          }
          media(first: $mediaFirst) {
            nodes {
              ... on MediaImage {
                image {
                  url
                  altText
                }
              }
            }
          }
          variants(first: $variantsFirst) {
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
    }
    ${CATALOG_VARIANT_FRAGMENT}
  `,
  schema: catalogProductsSchema,
};
