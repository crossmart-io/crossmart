import { z } from 'zod';
import type { ShopifyOperation } from './shopify-operation.js';

export interface InventoryLevelsVariables {
  ids: string[];
  locationId: string;
}

const inventoryLevelsSchema = z.object({
  nodes: z.array(
    z
      .object({
        id: z.string(),
        /** Null when the item is not stocked at the location. */
        inventoryLevel: z
          .object({ quantities: z.array(z.object({ name: z.string(), quantity: z.number() })) })
          .nullable(),
      })
      // Ids that no longer exist come back as null.
      .nullable(),
  ),
});

export type InventoryLevelsData = z.infer<typeof inventoryLevelsSchema>;

/** The available quantity of each inventory item at one location, read for reconciliation. */
export const INVENTORY_LEVELS_QUERY: ShopifyOperation<
  InventoryLevelsData,
  InventoryLevelsVariables
> = {
  name: 'InventoryLevels',
  document: /* GraphQL */ `
    query InventoryLevels($ids: [ID!]!, $locationId: ID!) {
      nodes(ids: $ids) {
        ... on InventoryItem {
          id
          inventoryLevel(locationId: $locationId) {
            quantities(names: ["available"]) {
              name
              quantity
            }
          }
        }
      }
    }
  `,
  schema: inventoryLevelsSchema,
};
