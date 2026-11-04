/** How a connection's pricing rule rounds the adjusted price. Every mode rounds up. */
export enum PriceRounding {
  /** To the currency's precision only: 102.35. */
  None = 'none',
  /** Up to the next price ending in .99: 102.99. */
  Ending99 = 'ending_99',
  /** Up to the next price ending in .95: 102.95. */
  Ending95 = 'ending_95',
  /** Up to the next whole amount: 103. */
  Whole = 'whole',
}
