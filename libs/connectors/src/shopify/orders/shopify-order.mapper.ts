import type { ExternalOrder } from '../../sdk/capabilities/order-source.js';
import type { ShopifyOrder } from '../graphql/order.fragment.js';

/** A Shopify order in channel-neutral terms. Shipped units are those no longer unfulfilled. */
export function toExternalOrder(order: ShopifyOrder): ExternalOrder {
  return {
    externalId: order.id,
    name: order.name,
    placedAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
    cancelled: order.cancelledAt !== null,
    currencyCode: order.currencyCode,
    total: order.currentTotalPriceSet.shopMoney.amount,
    lines: order.lineItems.nodes.map((line) => ({
      externalId: line.id,
      externalVariantId: line.variant?.id ?? null,
      sku: line.sku || null,
      title: line.name,
      quantity: line.currentQuantity,
      fulfilledQuantity: Math.max(
        0,
        Math.min(line.currentQuantity, line.currentQuantity - line.unfulfilledQuantity),
      ),
      unitPrice: line.originalUnitPriceSet.shopMoney.amount,
    })),
  };
}
