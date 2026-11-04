import { z } from 'zod';
import type { ShopifyOperation } from './shopify-operation.js';

const primaryLocationSchema = z.object({
  /** `location` without an id is the store's primary location; null when it has none. */
  location: z.object({ id: z.string() }).nullable(),
});

export type PrimaryLocationData = z.infer<typeof primaryLocationSchema>;

/** Where stock is read from. Read per page, so a changed primary location applies at once. */
export const PRIMARY_LOCATION_QUERY: ShopifyOperation<PrimaryLocationData> = {
  name: 'PrimaryLocation',
  document: /* GraphQL */ `
    query PrimaryLocation {
      location {
        id
      }
    }
  `,
  schema: primaryLocationSchema,
};
