import { OrderStatus } from '@crossmart/database';

/** The stock an order line holds: units waiting to ship, and units that have shipped. */
export interface LineStock {
  reserved: number;
  fulfilled: number;
}

/** What one ingestion of a line changes on its variant's stock. */
export interface LineStockChange {
  next: LineStock;
  /** Added to the item's `reserved` (negative releases units). */
  reservedDelta: number;
  /** Added to the item's `available`: what the line takes from, or gives back to, sale. */
  availableDelta: number;
  /** Units that left the stock on hand, for the ledger. */
  shipped: number;
}

/**
 * Moves a line's stock from what it held to what the order says now, so applying the same
 * order twice changes nothing. Shipped units never come back (returns are a later step); a
 * cancelled order releases what it still held.
 */
export function lineStockChange(
  held: LineStock,
  line: { quantity: number; fulfilledQuantity: number },
  cancelled: boolean,
): LineStockChange {
  const fulfilled = Math.max(held.fulfilled, Math.min(line.fulfilledQuantity, line.quantity));
  const reserved = cancelled ? 0 : Math.max(0, line.quantity - fulfilled);
  const shipped = fulfilled - held.fulfilled;
  const reservedDelta = reserved - held.reserved;
  return {
    next: { reserved, fulfilled },
    reservedDelta,
    availableDelta: 0 - reservedDelta - shipped,
    shipped,
  };
}

/** Where the order stands, from its lines. */
export function orderStatusOf(
  cancelled: boolean,
  lines: readonly { quantity: number; fulfilledQuantity: number }[],
): OrderStatus {
  if (cancelled) return OrderStatus.CANCELLED;
  const ordered = lines.reduce((sum, line) => sum + line.quantity, 0);
  const shipped = lines.reduce(
    (sum, line) => sum + Math.min(line.fulfilledQuantity, line.quantity),
    0,
  );
  if (shipped === 0) return OrderStatus.OPEN;
  return shipped >= ordered ? OrderStatus.FULFILLED : OrderStatus.PARTIALLY_FULFILLED;
}
