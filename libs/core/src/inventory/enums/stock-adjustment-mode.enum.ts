/** How an adjustment's quantity applies to the stock on hand. */
export enum StockAdjustmentMode {
  /** Add the quantity, or remove it when negative. */
  Delta = 'delta',
  /** Replace the stock on hand with the quantity, as after a count. */
  Set = 'set',
}
