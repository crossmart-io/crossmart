import { AMOUNT_FRACTION_DIGITS, FixedDecimal } from '@crossmart/common';
import type { EtsyMoney } from './etsy-listing.types.js';

/** Etsy's `Money` as a decimal: `amount / divisor`. */
export function etsyMoneyToDecimal(money: EtsyMoney): FixedDecimal {
  return FixedDecimal.fromInteger(money.amount).dividedBy(FixedDecimal.fromInteger(money.divisor));
}

/** A decimal string as the float Etsy's inventory takes ("assign a float equal to amount divided by divisor"). */
export function toEtsyPrice(amount: string | FixedDecimal): number {
  const decimal =
    typeof amount === 'string' ? (FixedDecimal.parse(amount) ?? FixedDecimal.ZERO) : amount;
  return Number(decimal.toFixed(AMOUNT_FRACTION_DIGITS));
}
