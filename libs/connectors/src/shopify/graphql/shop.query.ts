import { z } from 'zod';
import type { ShopifyOperation } from './shopify-operation.js';

const shopDataSchema = z.object({
  shop: z.object({
    name: z.string(),
    myshopifyDomain: z.string(),
    currencyCode: z.string(),
    ianaTimezone: z.string().nullable(),
    primaryDomain: z.object({ url: z.string() }).nullable(),
  }),
  /** The primary location: `location` without an id. Null when the shop has none. */
  location: z.object({ id: z.string(), name: z.string() }).nullable(),
});

export type ShopData = z.infer<typeof shopDataSchema>;

/** The store's name, currency and primary location, read when it is connected. */
export const SHOP_QUERY: ShopifyOperation<ShopData> = {
  name: 'ShopDetails',
  document: /* GraphQL */ `
    query ShopDetails {
      shop {
        name
        myshopifyDomain
        currencyCode
        ianaTimezone
        primaryDomain {
          url
        }
      }
      location {
        id
        name
      }
    }
  `,
  schema: shopDataSchema,
};
