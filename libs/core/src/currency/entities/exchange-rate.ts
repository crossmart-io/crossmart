/** One day's rates as the ECB published them: units of each currency per euro. */
export interface DailyRates {
  publishedOn: Date;
  /** Currency code to rate per euro, as a decimal string. */
  ratesPerEuro: Map<string, string>;
}

/** What one unit of `from` is worth in `to`, and where that came from. */
export interface ExchangeRateQuote {
  from: string;
  to: string;
  /** Units of `to` per unit of `from`, as a decimal string. */
  rate: string;
  publishedOn: Date;
}
