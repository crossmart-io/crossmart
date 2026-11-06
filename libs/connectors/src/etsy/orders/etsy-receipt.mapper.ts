import { AMOUNT_FRACTION_DIGITS, FixedDecimal } from '@crossmart/common';
import type { ExternalOrder, ExternalOrderLine } from '../../sdk/capabilities/order-source.js';
import { MILLISECONDS_PER_SECOND } from '../../sdk/time/time.constants.js';
import { EtsyReceiptStatus } from '../etsy.enums.js';
import { etsyMoneyToDecimal } from '../publish/etsy-money.js';
import type { EtsyReceipt, EtsyTransaction } from './etsy-receipt.types.js';

function fromEpochSeconds(seconds: number): Date {
  return new Date(seconds * MILLISECONDS_PER_SECOND);
}

function format(amount: FixedDecimal): string {
  return amount.toFixed(AMOUNT_FRACTION_DIGITS);
}

/** What the buyer pays now: the grand total minus refunds in its currency, never below zero. */
function totalOf(receipt: EtsyReceipt): string {
  const { currency_code: currency } = receipt.grandtotal;
  const refunded = receipt.refunds
    .filter(({ amount }) => amount.currency_code === currency)
    .reduce((sum, { amount }) => sum.plus(etsyMoneyToDecimal(amount)), FixedDecimal.ZERO);
  return format(etsyMoneyToDecimal(receipt.grandtotal).minus(refunded).max(FixedDecimal.ZERO));
}

/**
 * A transaction is one line. Etsy dates its shipment per transaction; a receipt marked shipped
 * ships all its lines.
 */
function toOrderLine(transaction: EtsyTransaction, receiptShipped: boolean): ExternalOrderLine {
  const shipped = receiptShipped || Boolean(transaction.shipped_timestamp);
  const sku = transaction.sku || null;
  return {
    externalId: String(transaction.transaction_id),
    // Crossmart lists each variant under its own SKU, which is the variant's id on Etsy.
    externalVariantId: sku,
    sku,
    title: transaction.title ?? '',
    quantity: transaction.quantity,
    fulfilledQuantity: shipped ? transaction.quantity : 0,
    unitPrice: format(etsyMoneyToDecimal(transaction.price)),
  };
}

/** An Etsy receipt in channel-neutral terms. The receipt id is the order number sellers see. */
export function toExternalOrder(receipt: EtsyReceipt): ExternalOrder {
  const receiptId = String(receipt.receipt_id);
  return {
    externalId: receiptId,
    name: receiptId,
    placedAt: fromEpochSeconds(receipt.created_timestamp),
    updatedAt: fromEpochSeconds(receipt.updated_timestamp),
    cancelled: receipt.status === EtsyReceiptStatus.Canceled,
    currencyCode: receipt.grandtotal.currency_code,
    total: totalOf(receipt),
    lines: receipt.transactions.map((transaction) => toOrderLine(transaction, receipt.is_shipped)),
  };
}
