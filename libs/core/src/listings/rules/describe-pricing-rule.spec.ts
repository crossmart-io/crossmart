import { CompareAtMode } from '../../channels/enums/compare-at-mode.enum.js';
import { PriceRounding } from '../../channels/enums/price-rounding.enum.js';
import { describePricingRule } from './describe-pricing-rule.js';

describe('describePricingRule', () => {
  it('names each part that changes prices', () => {
    expect(
      describePricingRule({
        adjustmentPercent: '-12.5',
        fixedAmount: '2.00',
        rounding: PriceRounding.Ending95,
        floor: { minMarginPercent: '20' },
        compareAt: CompareAtMode.Omit,
      }),
    ).toBe('-12.5%, +2, .95, floor cost +20%, no compare-at');
  });

  it('says prices are unchanged without a rule, or with one that changes nothing', () => {
    const neutral = {
      adjustmentPercent: '0',
      fixedAmount: '0.00',
      rounding: PriceRounding.None,
      floor: null,
      compareAt: CompareAtMode.Adjust,
    };

    expect(describePricingRule(null)).toBe('prices as in the catalog');
    expect(describePricingRule(neutral)).toBe('prices as in the catalog');
  });
});
