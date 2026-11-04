import { toAmount } from '../../catalog/mappers/decimal-amount.mapper.js';
import type { OrderDetail, OrderSummary } from '../entities/order-views.js';
import type { OrderDetailRecord, OrderSummaryRecord } from '../repositories/order.queries.js';

export function toOrderSummary(record: OrderSummaryRecord): OrderSummary {
  return {
    id: record.id,
    name: record.name,
    status: record.status,
    currencyCode: record.currencyCode,
    total: toAmount(record.total),
    placedAt: record.placedAt,
    connectionId: record.connectionId,
    storeName: record.connection.displayName,
    channel: record.connection.channel,
    itemCount: record.lines.reduce((sum, line) => sum + line.quantity, 0),
    unmatchedLines: record.lines.filter((line) => line.quantity > 0 && !line.variantId).length,
  };
}

export function toOrderDetail(record: OrderDetailRecord): OrderDetail {
  return {
    ...toOrderSummary(record),
    externalId: record.externalId,
    lines: record.lines
      .filter((line) => line.quantity > 0 || line.fulfilledQuantity > 0)
      .map((line) => ({
        id: line.id,
        title: line.title,
        sku: line.sku,
        quantity: line.quantity,
        unitPrice: toAmount(line.unitPrice),
        reservedQuantity: line.reservedQuantity,
        fulfilledQuantity: line.fulfilledQuantity,
        variantId: line.variantId,
        productId: line.variant?.productId ?? null,
      })),
  };
}
