import { ItemCondition } from '../../sdk/listings/item-condition.enum.js';
import { EbayCondition } from './ebay-condition.enum.js';
import { ebayConditionOf } from './ebay-condition.mapper.js';

describe('ebayConditionOf', () => {
  it('maps every Crossmart condition to the eBay condition of the same grade', () => {
    const fallback = EbayCondition.New;
    expect(
      Object.fromEntries(
        Object.values(ItemCondition).map((condition) => [
          condition,
          ebayConditionOf(condition, fallback),
        ]),
      ),
    ).toEqual({
      NEW: 'NEW',
      NEW_OTHER: 'NEW_OTHER',
      NEW_WITH_DEFECTS: 'NEW_WITH_DEFECTS',
      LIKE_NEW: 'LIKE_NEW',
      REFURBISHED: 'SELLER_REFURBISHED',
      USED_EXCELLENT: 'USED_EXCELLENT',
      USED_VERY_GOOD: 'USED_VERY_GOOD',
      USED_GOOD: 'USED_GOOD',
      USED_FAIR: 'USED_ACCEPTABLE',
      FOR_PARTS: 'FOR_PARTS_OR_NOT_WORKING',
    });
  });

  it('falls back to the store’s default condition when the product has none', () => {
    expect(ebayConditionOf(null, EbayCondition.UsedGood)).toBe(EbayCondition.UsedGood);
    expect(ebayConditionOf(undefined, EbayCondition.New)).toBe(EbayCondition.New);
  });
});
