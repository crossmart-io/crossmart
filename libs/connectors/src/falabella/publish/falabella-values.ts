import {
  GRAMS_PER_KILOGRAM,
  PRICE_FRACTION_DIGITS,
  WEIGHT_FRACTION_DIGITS,
} from '../falabella.constants.js';

/** A decimal price with a dot and two decimals, as Falabella's examples send (`1600.00`). */
export function falabellaPrice(price: string): string {
  return Number(price).toFixed(PRICE_FRACTION_DIGITS);
}

/** A weight in kilograms, without trailing zeros: 500 g is `0.5`. */
export function falabellaWeight(grams: number): string {
  return String(Number((grams / GRAMS_PER_KILOGRAM).toFixed(WEIGHT_FRACTION_DIGITS)));
}
