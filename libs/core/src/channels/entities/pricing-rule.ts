import { z } from 'zod';
import { FixedDecimal } from '@crossmart/common';
import {
  PRICING_MAX_FIXED_AMOUNT,
  PRICING_MAX_MARGIN_PERCENT,
  PRICING_MAX_PERCENT,
  PRICING_MIN_PERCENT,
} from '../channels.constants.js';
import { CompareAtMode } from '../enums/compare-at-mode.enum.js';
import { PriceRounding } from '../enums/price-rounding.enum.js';

/** A signed decimal string with at most two fraction digits, within `[min, max]`. */
function decimalBetween(min: number, max: number): z.ZodString {
  const low = FixedDecimal.fromInteger(min);
  const high = FixedDecimal.fromInteger(max);
  return z
    .string()
    .regex(/^-?\d+(\.\d{1,2})?$/, 'must be a decimal with at most two fraction digits')
    .refine((text) => {
      const value = FixedDecimal.of(text);
      return !value.lessThan(low) && !value.greaterThan(high);
    }, `must be between ${min} and ${max}`);
}

/** Never sell below cost plus this margin. Variants without a cost are not floored. */
export const pricingFloorSchema = z
  .object({ minMarginPercent: decimalBetween(0, PRICING_MAX_MARGIN_PERCENT) })
  .strict();

/**
 * How a connection prices variants that have no manual price: the base price moved by
 * `adjustmentPercent`, plus `fixedAmount`, rounded, then raised to the floor if below it.
 */
export const pricingRuleSchema = z
  .object({
    adjustmentPercent: decimalBetween(PRICING_MIN_PERCENT, PRICING_MAX_PERCENT),
    fixedAmount: decimalBetween(-PRICING_MAX_FIXED_AMOUNT, PRICING_MAX_FIXED_AMOUNT),
    rounding: z.enum(PriceRounding),
    floor: pricingFloorSchema.nullable(),
    compareAt: z.enum(CompareAtMode),
  })
  .strict();

export type PricingFloor = z.infer<typeof pricingFloorSchema>;
export type PricingRule = z.infer<typeof pricingRuleSchema>;
