/** Where a channel price comes from, in order of precedence. */
export enum PriceSource {
  /** A fixed price the merchant set for this variant on this listing. */
  Override = 'override',
  /** The connection's pricing rule applied to the variant's price. */
  Rule = 'rule',
  /** The variant's price, unchanged: the connection has no rule. */
  Base = 'base',
}
