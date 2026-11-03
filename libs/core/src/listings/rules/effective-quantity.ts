/** How a listing limits the stock it shows. */
export interface QuantityLimits {
  inventoryBuffer: number | null;
  maxQuantity: number | null;
}

/** What a channel shows: available minus the buffer, never below zero, capped by the maximum. */
export function effectiveQuantity(available: number, limits: QuantityLimits | null): number {
  const buffered = Math.max(available - (limits?.inventoryBuffer ?? 0), 0);
  const max = limits?.maxQuantity;
  return max === null || max === undefined ? buffered : Math.min(buffered, max);
}
