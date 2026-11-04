import { z } from 'zod';
import { SHOPIFY_ORDER_LINES_PAGE_SIZE } from '../shopify.constants.js';

/** What Crossmart reads of an order: its lines and totals, never the buyer. */
export const ORDER_FRAGMENT = /* GraphQL */ `
  fragment CrossmartOrder on Order {
    id
    name
    createdAt
    updatedAt
    cancelledAt
    currencyCode
    currentTotalPriceSet {
      shopMoney {
        amount
      }
    }
    lineItems(first: ${SHOPIFY_ORDER_LINES_PAGE_SIZE}) {
      nodes {
        id
        sku
        name
        currentQuantity
        unfulfilledQuantity
        variant {
          id
        }
        originalUnitPriceSet {
          shopMoney {
            amount
          }
        }
      }
    }
  }
`;

const moneySchema = z.object({ shopMoney: z.object({ amount: z.string() }) });

export const shopifyOrderSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  cancelledAt: z.string().nullable(),
  currencyCode: z.string(),
  currentTotalPriceSet: moneySchema,
  lineItems: z.object({
    nodes: z.array(
      z.object({
        id: z.string(),
        sku: z.string().nullable(),
        name: z.string(),
        currentQuantity: z.number(),
        unfulfilledQuantity: z.number(),
        variant: z.object({ id: z.string() }).nullable(),
        originalUnitPriceSet: moneySchema,
      }),
    ),
  }),
});

export type ShopifyOrder = z.infer<typeof shopifyOrderSchema>;
