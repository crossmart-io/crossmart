import { FixedDecimal } from '@crossmart/common';
import type { PricingRule } from '../../channels/entities/pricing-rule.js';
import { CompareAtMode } from '../../channels/enums/compare-at-mode.enum.js';
import { PriceRounding } from '../../channels/enums/price-rounding.enum.js';
import { ROUNDING_LABELS } from '../listings.constants.js';

const PART_SEPARATOR = ', ';
const NO_RULE = 'prices as in the catalog';
const COMPARE_AT_LABELS: Record<CompareAtMode, string | null> = {
  [CompareAtMode.Adjust]: null,
  [CompareAtMode.Keep]: 'compare-at kept',
  [CompareAtMode.Omit]: 'no compare-at',
};

function signed(value: string, suffix = ''): string | null {
  const amount = FixedDecimal.of(value);
  if (amount.isZero()) return null;
  return `${amount.isNegative() ? '-' : '+'}${amount.abs().toString()}${suffix}`;
}

/** A pricing rule in a few words, for the activity log: "+15%, .99, floor cost +30%". */
export function describePricingRule(rule: PricingRule | null): string {
  if (!rule) return NO_RULE;
  const parts = [
    signed(rule.adjustmentPercent, '%'),
    signed(rule.fixedAmount),
    rule.rounding === PriceRounding.None ? null : ROUNDING_LABELS[rule.rounding],
    rule.floor ? `floor cost +${rule.floor.minMarginPercent}%` : null,
    COMPARE_AT_LABELS[rule.compareAt],
  ].filter((part): part is string => part !== null);
  return parts.length > 0 ? parts.join(PART_SEPARATOR) : NO_RULE;
}
