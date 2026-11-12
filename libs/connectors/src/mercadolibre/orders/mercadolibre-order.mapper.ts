import { AMOUNT_FRACTION_DIGITS, FixedDecimal } from '@crossmart/common';
import type { ExternalOrder, ExternalOrderLine } from '../../sdk/capabilities/order-source.js';
import { MERCADOLIBRE_ORDER_NAME_PREFIX } from '../mercadolibre.constants.js';
import { MercadoLibreOrderStatus } from '../mercadolibre.enums.js';
import { formatVariantKey } from '../publish/mercadolibre-keys.js';
import type { MercadoLibreOrder } from './mercadolibre-order.types.js';

const CANCELLED: ReadonlySet<string> = new Set([
  MercadoLibreOrderStatus.Cancelled,
  MercadoLibreOrderStatus.Invalid,
]);

/** A Mercado Libre amount (a JSON number) as a decimal string. */
function decimalAmount(amount: number): string {
  return (FixedDecimal.parse(String(amount)) ?? FixedDecimal.ZERO).toFixed(AMOUNT_FRACTION_DIGITS);
}

/** When the order last changed: its last update, else when it closed or was placed. */
function updatedAt(order: MercadoLibreOrder): Date {
  return new Date(
    order.date_last_updated ?? order.last_updated ?? order.date_closed ?? order.date_created,
  );
}

/**
 * A line sells an item, or a variation of one: the same key its listing variant was stored
 * with, so the sale moves that variant's stock.
 */
function toLine(
  line: MercadoLibreOrder['order_items'][number],
  fulfilled: boolean,
): ExternalOrderLine {
  const key = formatVariantKey({
    itemId: line.item.id,
    variationId: line.item.variation_id ?? null,
  });
  return {
    externalId: key,
    externalVariantId: key,
    sku: line.item.seller_sku ?? null,
    title: line.item.title,
    quantity: line.quantity,
    fulfilledQuantity: fulfilled ? line.quantity : 0,
    unitPrice: decimalAmount(line.unit_price),
  };
}

/** An order in Crossmart's terms; buyer details are not read. */
export function toExternalOrder(order: MercadoLibreOrder): ExternalOrder {
  return {
    externalId: String(order.id),
    name: `${MERCADOLIBRE_ORDER_NAME_PREFIX}${order.id}`,
    placedAt: new Date(order.date_created),
    updatedAt: updatedAt(order),
    cancelled: CANCELLED.has(order.status),
    currencyCode: order.currency_id,
    total: decimalAmount(order.total_amount),
    lines: order.order_items.map((line) => toLine(line, order.fulfilled === true)),
  };
}
