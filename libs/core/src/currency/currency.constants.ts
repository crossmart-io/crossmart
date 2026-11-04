/** The European Central Bank's daily reference rates, published around 16:00 CET on working days. */
export const ECB_DAILY_RATES_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
export const ECB_REQUEST_TIMEOUT_MS = 10_000;
/** The base of ECB rates: every other currency is quoted per euro. */
export const EURO = 'EUR';
/** Stored rates older than this are refreshed before use. Covers weekends and holidays. */
export const RATES_MAX_AGE_MS = 26 * 60 * 60 * 1000;
/** How often one process asks the ECB at most, so failures do not turn into a request per price. */
export const RATES_CHECK_INTERVAL_MS = 60 * 60 * 1000;
/** Fraction digits of a stored or computed rate. */
export const RATE_FRACTION_DIGITS = 6;
