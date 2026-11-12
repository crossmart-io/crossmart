import type { ExternalOrder, ExternalOrderLine } from '../../sdk/capabilities/order-source.js';
import { PRICE_FRACTION_DIGITS } from '../falabella.constants.js';
import { FalabellaOrderItemStatus } from '../falabella.enums.js';
import type { FalabellaCountryProfile } from '../falabella-countries.js';
import { sellerCenterDate } from './falabella-dates.js';
import type { FalabellaOrder, FalabellaOrderItem } from './falabella-order.types.js';

/** Item statuses after the item left the seller: it counts as shipped. */
const SHIPPED_STATUSES: ReadonlySet<string> = new Set([
  FalabellaOrderItemStatus.Shipped,
  FalabellaOrderItemStatus.Delivered,
  FalabellaOrderItemStatus.FailedDelivery,
  FalabellaOrderItemStatus.ReturnShippedByCustomer,
  FalabellaOrderItemStatus.ReturnWaitingForApproval,
  FalabellaOrderItemStatus.ReturnRejected,
  FalabellaOrderItemStatus.Returned,
]);

function isCanceled(item: FalabellaOrderItem): boolean {
  return item.Status === FalabellaOrderItemStatus.Canceled;
}

/** Each item is one unit; a canceled item no longer holds stock. */
function toLine(item: FalabellaOrderItem): ExternalOrderLine {
  const quantity = isCanceled(item) ? 0 : 1;
  return {
    externalId: item.OrderItemId,
    externalVariantId: item.Sku,
    sku: item.Sku,
    title: item.Name,
    quantity,
    fulfilledQuantity: SHIPPED_STATUSES.has(item.Status) ? quantity : 0,
    unitPrice: Number(item.ItemPrice).toFixed(PRICE_FRACTION_DIGITS),
  };
}

/** What the buyer pays for the items still in the order: their paid prices and shipping. */
function total(items: readonly FalabellaOrderItem[]): string {
  const sum = items
    .filter((item) => !isCanceled(item))
    .reduce((paid, item) => paid + Number(item.PaidPrice) + Number(item.ShippingAmount ?? 0), 0);
  return sum.toFixed(PRICE_FRACTION_DIGITS);
}

/** A Falabella order and its items in Crossmart's terms; no buyer details are kept. */
export function toExternalOrder(
  order: FalabellaOrder,
  items: readonly FalabellaOrderItem[],
  country: FalabellaCountryProfile,
): ExternalOrder {
  return {
    externalId: order.OrderId,
    name: order.OrderNumber,
    placedAt: sellerCenterDate(order.CreatedAt, country.timeZone),
    updatedAt: sellerCenterDate(order.UpdatedAt, country.timeZone),
    cancelled: items.length > 0 && items.every(isCanceled),
    currencyCode: items.find((item) => item.Currency)?.Currency ?? country.currencyCode,
    total: total(items),
    lines: items.map(toLine),
  };
}
