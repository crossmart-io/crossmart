import { z } from 'zod';
import { xmlList, xmlObject, xmlOptionalText } from '../api/falabella-xml.js';

export const orderSchema = z.object({
  OrderId: z.string(),
  OrderNumber: z.string(),
  CreatedAt: z.string(),
  UpdatedAt: z.string(),
});

export type FalabellaOrder = z.infer<typeof orderSchema>;

/** One order item: one unit of one SKU. */
export const orderItemSchema = z.object({
  OrderItemId: z.string(),
  Name: z.string(),
  Sku: xmlOptionalText,
  Currency: xmlOptionalText.optional(),
  Status: z.string(),
  ItemPrice: z.string(),
  PaidPrice: z.string(),
  ShippingAmount: xmlOptionalText.optional(),
});

export type FalabellaOrderItem = z.infer<typeof orderItemSchema>;

/** `GetOrders` and `GetOrder`. */
export const ordersBodySchema = xmlObject({
  Orders: xmlObject({ Order: xmlList(orderSchema).optional() }).optional(),
});

/** `GetMultipleOrderItems`: each order with its items. */
export const multipleOrderItemsBodySchema = xmlObject({
  Orders: xmlObject({
    Order: xmlList(
      z.object({
        OrderId: z.string(),
        OrderItems: xmlObject({ OrderItem: xmlList(orderItemSchema).optional() }).optional(),
      }),
    ).optional(),
  }).optional(),
});

/** `GetOrderItems`. */
export const orderItemsBodySchema = xmlObject({
  OrderItems: xmlObject({ OrderItem: xmlList(orderItemSchema).optional() }).optional(),
});
