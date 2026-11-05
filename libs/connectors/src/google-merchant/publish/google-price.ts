import { MICROS_PER_UNIT } from '../google-merchant.constants.js';
import type { GooglePrice } from './google-product-input.js';

const DECIMAL_SEPARATOR = '.';
const MICROS_DIGITS = String(MICROS_PER_UNIT).length - 1;
const ZERO = '0';

/**
 * A decimal amount such as `"12.5"` in millionths (`"12500000"`), computed on the digits so no
 * floating-point rounding creeps in.
 */
export function toMicros(amount: string): string {
  const [units = ZERO, fraction = ''] = amount.trim().split(DECIMAL_SEPARATOR);
  const micros = `${units}${fraction.padEnd(MICROS_DIGITS, ZERO).slice(0, MICROS_DIGITS)}`;
  return BigInt(micros).toString();
}

function money(amount: string, currencyCode: string): GooglePrice {
  return { amountMicros: toMicros(amount), currencyCode };
}

/**
 * Google's price and sale price. A compare-at price above the price is the regular price, and
 * the price is then the sale price; otherwise the price stands alone.
 */
export function toGooglePrices(
  prices: { price: string; compareAtPrice: string | null },
  currencyCode: string,
): { price: GooglePrice; salePrice?: GooglePrice } {
  const compareAt = prices.compareAtPrice;
  if (compareAt && Number(compareAt) > Number(prices.price)) {
    return { price: money(compareAt, currencyCode), salePrice: money(prices.price, currencyCode) };
  }
  return { price: money(prices.price, currencyCode) };
}
