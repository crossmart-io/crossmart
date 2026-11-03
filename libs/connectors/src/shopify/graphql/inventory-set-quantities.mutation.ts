import { z } from 'zod';
import type { ShopifyOperation } from './shopify-operation.js';
import { shopifyUserErrorsSchema } from './shopify-user-error.js';

export interface InventorySetQuantityInput {
  inventoryItemId: string;
  locationId: string;
  quantity: number;
  /** Null skips Shopify's compare check: Crossmart's ledger is the source of truth. */
  changeFromQuantity: null;
}

export interface InventorySetQuantitiesVariables {
  input: { name: string; reason: string; quantities: InventorySetQuantityInput[] };
  /** Required from 2026-04; the client resends the same key when it retries. */
  idempotencyKey: string;
}

const inventorySetDataSchema = z.object({
  inventorySetQuantities: z.object({ userErrors: shopifyUserErrorsSchema }),
});

/** Sets absolute available quantities at a location, for up to 250 items at a time. */
export const INVENTORY_SET_QUANTITIES_MUTATION: ShopifyOperation<
  z.infer<typeof inventorySetDataSchema>,
  InventorySetQuantitiesVariables
> = {
  name: 'InventorySetQuantities',
  document: /* GraphQL */ `
    mutation InventorySetQuantities(
      $input: InventorySetQuantitiesInput!
      $idempotencyKey: String!
    ) {
      inventorySetQuantities(input: $input) @idempotent(key: $idempotencyKey) {
        userErrors {
          code
          field
          message
        }
      }
    }
  `,
  schema: inventorySetDataSchema,
};
