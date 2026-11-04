/** One step of a price calculation, as the explanation lists it. */
export enum PriceStepKind {
  Base = 'base',
  /** The catalog price converted into the store's currency. */
  Conversion = 'conversion',
  Percent = 'percent',
  FixedAmount = 'fixed_amount',
  Rounding = 'rounding',
  Floor = 'floor',
  Override = 'override',
}
