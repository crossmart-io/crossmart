import { z } from 'zod';
import { ORDER_FRAGMENT, shopifyOrderSchema } from './order.fragment.js';
import type { ShopifyOperation } from './shopify-operation.js';

export interface OrdersVariables {
  first: number;
  after: string | null;
  query: string;
}

const ordersSchema = z.object({
  orders: z.object({
    nodes: z.array(shopifyOrderSchema),
    pageInfo: z.object({ hasNextPage: z.boolean(), endCursor: z.string().nullable() }),
  }),
});

/** Orders changed since a time, oldest change first, so a poll can resume where it stopped. */
export const ORDERS_QUERY: ShopifyOperation<z.infer<typeof ordersSchema>, OrdersVariables> = {
  name: 'Orders',
  document: /* GraphQL */ `
    ${ORDER_FRAGMENT}
    query Orders($first: Int!, $after: String, $query: String!) {
      orders(first: $first, after: $after, query: $query, sortKey: UPDATED_AT) {
        nodes {
          ...CrossmartOrder
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `,
  schema: ordersSchema,
};

const orderSchema = z.object({ order: shopifyOrderSchema.nullable() });

/** One order by id, read when a webhook says it changed. */
export const ORDER_QUERY: ShopifyOperation<z.infer<typeof orderSchema>, { id: string }> = {
  name: 'Order',
  document: /* GraphQL */ `
    ${ORDER_FRAGMENT}
    query Order($id: ID!) {
      order(id: $id) {
        ...CrossmartOrder
      }
    }
  `,
  schema: orderSchema,
};
