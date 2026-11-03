/** Something the merchant should know about a resolved price. */
export enum PriceWarning {
  /** The rule has a floor, but the variant has no cost, so it was not floored. */
  MissingCost = 'missing_cost',
  /** A manual price is below the rule's floor; it is sent anyway. */
  BelowFloor = 'below_floor',
  /** The compare-at price was not above the price, so none is sent. */
  CompareAtDropped = 'compare_at_dropped',
  /** The adjustment would make the price negative; it is sent as zero. */
  ClampedToZero = 'clamped_to_zero',
}
