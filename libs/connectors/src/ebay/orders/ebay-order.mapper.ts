import { AMOUNT_FRACTION_DIGITS, FixedDecimal } from '@crossmart/common';
import type { ExternalOrder, ExternalOrderLine } from '../../sdk/capabilities/order-source.js';
import {
  EbayCancelState,
  EbayLineItemFulfillmentStatus,
  EbayRefundStatus,
} from './ebay-order.enums.js';
import type { EbayOrder, EbayOrderAmount, EbayOrderLineItem } from './ebay-order.types.js';

/** An amount eBay sent, or zero when it is not a decimal Crossmart can read. */
function amountOf(amount: EbayOrderAmount): FixedDecimal {
  return FixedDecimal.parse(amount.value) ?? FixedDecimal.ZERO;
}

function format(amount: FixedDecimal): string {
  return amount.toFixed(AMOUNT_FRACTION_DIGITS);
}

/**
 * What the seller has refunded, in the order's currency. eBay reports a refund issued for the
 * whole order in `paymentSummary.refunds` (only `REFUNDED` ones are final) and one issued per
 * line in that line's `refunds`, so the order-level list wins when it has any, and the lines'
 * are summed otherwise, never both.
 */
function refundedAmount(order: EbayOrder, currency: string): FixedDecimal {
  const orderRefunds = (order.paymentSummary?.refunds ?? []).filter(
    (refund) => refund.refundStatus === EbayRefundStatus.Refunded,
  );
  const amounts =
    orderRefunds.length > 0
      ? orderRefunds.map((refund) => refund.amount)
      : order.lineItems.flatMap((line) => line.refunds.map((refund) => refund.amount));
  return amounts.reduce(
    (sum, amount) => (amount && amount.currency === currency ? sum.plus(amountOf(amount)) : sum),
    FixedDecimal.ZERO,
  );
}

/** The order total after refunds, never below zero. */
function totalOf(order: EbayOrder): string {
  const { total } = order.pricingSummary;
  const remaining = amountOf(total).minus(refundedAmount(order, total.currency));
  return format(remaining.max(FixedDecimal.ZERO));
}

/** `lineItemCost` is the unit price times the quantity, before discounts. */
function unitPriceOf(line: EbayOrderLineItem): string {
  const cost = amountOf(line.lineItemCost);
  return format(line.quantity > 0 ? cost.dividedBy(FixedDecimal.fromInteger(line.quantity)) : cost);
}

/**
 * eBay says whether a line has shipped, not how many of its units: a line counts as shipped
 * once it is `FULFILLED`, and holds its units reserved until then.
 */
function toOrderLine(line: EbayOrderLineItem): ExternalOrderLine {
  const shipped = line.lineItemFulfillmentStatus === EbayLineItemFulfillmentStatus.Fulfilled;
  const sku = line.sku || null;
  return {
    externalId: line.lineItemId,
    // Crossmart lists each variant under its own SKU, which is the variant's id on eBay.
    externalVariantId: sku,
    sku,
    title: line.title,
    quantity: line.quantity,
    fulfilledQuantity: shipped ? line.quantity : 0,
    unitPrice: unitPriceOf(line),
  };
}

/** Lines listed on the connection's marketplace; lines that name none are kept. */
function linesOn(order: EbayOrder, marketplaceId: string): EbayOrderLineItem[] {
  return order.lineItems.filter(
    (line) => !line.listingMarketplaceId || line.listingMarketplaceId === marketplaceId,
  );
}

/**
 * An eBay order in channel-neutral terms, for the connection on `marketplaceId`. eBay returns
 * the seller's orders from every marketplace, and each marketplace is its own connection, so
 * an order with no line on this one is not this connection's (null).
 */
export function toExternalOrder(order: EbayOrder, marketplaceId: string): ExternalOrder | null {
  const lines = linesOn(order, marketplaceId);
  if (order.lineItems.length > 0 && lines.length === 0) return null;
  return {
    externalId: order.orderId,
    // eBay shows sellers the order id (such as 12-34567-89012) as the order number.
    name: order.orderId,
    placedAt: new Date(order.creationDate),
    updatedAt: new Date(order.lastModifiedDate),
    cancelled: order.cancelStatus?.cancelState === EbayCancelState.Canceled,
    currencyCode: order.pricingSummary.total.currency,
    total: totalOf(order),
    lines: lines.map(toOrderLine),
  };
}
