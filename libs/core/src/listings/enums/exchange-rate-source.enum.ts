/** Where the rate that converts catalog prices into a store's currency comes from. */
export enum ExchangeRateSource {
  /** The European Central Bank's latest daily reference rate. */
  Ecb = 'ecb',
  /** A rate the merchant set on the store's pricing rule. */
  Fixed = 'fixed',
}
