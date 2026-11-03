import { z } from 'zod';
import type { ShopifyOperation } from './shopify-operation.js';

const publicationsSchema = z.object({
  publications: z.object({
    nodes: z.array(
      z.object({
        id: z.string(),
        /** Deprecated in favour of the catalog's title, which some publications lack. */
        name: z.string().nullable().optional(),
        catalog: z.object({ title: z.string() }).nullable().optional(),
      }),
    ),
  }),
});

export type PublicationsData = z.infer<typeof publicationsSchema>;

/** The store's sales channels, to find the Online Store. Needs `read_publications`. */
export const PUBLICATIONS_QUERY: ShopifyOperation<PublicationsData, { first: number }> = {
  name: 'Publications',
  document: /* GraphQL */ `
    query Publications($first: Int!) {
      publications(first: $first) {
        nodes {
          id
          name
          catalog {
            title
          }
        }
      }
    }
  `,
  schema: publicationsSchema,
};
