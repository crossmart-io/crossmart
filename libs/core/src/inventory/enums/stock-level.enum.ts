/** How much of a variant is left to sell. Thresholds live in `inventory.constants.ts`. */
export enum StockLevel {
  InStock = 'in_stock',
  LowStock = 'low_stock',
  OutOfStock = 'out_of_stock',
  /** The variant does not track stock, so it never runs out. */
  Untracked = 'untracked',
}
