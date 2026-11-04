/** What a connection's pricing rule does with a variant's compare-at price. */
export enum CompareAtMode {
  /** Moves it by the same adjustment and rounding as the price, so the discount stays. */
  Adjust = 'adjust',
  /** Sends the catalog's compare-at price unchanged. */
  Keep = 'keep',
  /** Sends none: the channel shows no sale. */
  Omit = 'omit',
}
