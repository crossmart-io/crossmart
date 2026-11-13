import { z } from 'zod';

/** The fields Crossmart reads from an order (`GET /orders/{id}` and `/orders/search`). */
export const mercadoLibreOrderSchema = z.object({
  id: z.number().int(),
  status: z.string(),
  date_created: z.string(),
  date_last_updated: z.string().nullish(),
  last_updated: z.string().nullish(),
  date_closed: z.string().nullish(),
  currency_id: z.string(),
  total_amount: z.number(),
  fulfilled: z.boolean().nullish(),
  order_items: z.array(
    z.object({
      item: z.object({
        id: z.string(),
        title: z.string(),
        variation_id: z.number().int().nullish(),
        seller_sku: z.string().nullish(),
      }),
      quantity: z.number().int(),
      unit_price: z.number(),
    }),
  ),
});

export type MercadoLibreOrder = z.infer<typeof mercadoLibreOrderSchema>;

export const mercadoLibreOrdersPageSchema = z.object({
  results: z.array(mercadoLibreOrderSchema),
  paging: z.object({ total: z.number().int(), offset: z.number().int(), limit: z.number().int() }),
});
