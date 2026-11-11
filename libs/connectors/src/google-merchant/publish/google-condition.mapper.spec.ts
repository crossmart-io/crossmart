import { ItemCondition } from '../../sdk/listings/item-condition.enum.js';
import { googleConditionOf } from './google-condition.mapper.js';
import { GoogleCondition } from './google-product-input.js';

describe('googleConditionOf', () => {
  it('lists only brand-new items as new, restored ones as refurbished, the rest as used', () => {
    expect(googleConditionOf(ItemCondition.New)).toBe(GoogleCondition.New);
    expect(googleConditionOf(ItemCondition.Refurbished)).toBe(GoogleCondition.Refurbished);
    const used = Object.values(ItemCondition).filter(
      (condition) => condition !== ItemCondition.New && condition !== ItemCondition.Refurbished,
    );
    for (const condition of used) {
      expect(googleConditionOf(condition)).toBe(GoogleCondition.Used);
    }
  });

  it('keeps a product without a condition new, as before conditions existed', () => {
    expect(googleConditionOf(null)).toBe(GoogleCondition.New);
    expect(googleConditionOf(undefined)).toBe(GoogleCondition.New);
  });
});
