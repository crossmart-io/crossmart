import { ItemCondition } from '@crossmart/connectors';
import { ProductCondition } from '@crossmart/database';
import { toItemCondition } from './item-condition.mapper.js';

describe('toItemCondition', () => {
  it('names every catalog condition by the same value for connectors', () => {
    for (const condition of Object.values(ProductCondition)) {
      expect(toItemCondition(condition)).toBe(condition);
    }
    expect(new Set(Object.values(ItemCondition))).toEqual(new Set(Object.values(ProductCondition)));
  });

  it('is null for a product without a condition, so stores use their default', () => {
    expect(toItemCondition(null)).toBeNull();
  });
});
