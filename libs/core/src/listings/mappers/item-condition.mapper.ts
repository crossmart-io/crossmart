import { ItemCondition } from '@crossmart/connectors';
import { ProductCondition } from '@crossmart/database';

/** The connectors' name for each catalog condition; one entry per value, so none is missed. */
const ITEM_CONDITIONS: Readonly<Record<ProductCondition, ItemCondition>> = {
  [ProductCondition.NEW]: ItemCondition.New,
  [ProductCondition.NEW_OTHER]: ItemCondition.NewOther,
  [ProductCondition.NEW_WITH_DEFECTS]: ItemCondition.NewWithDefects,
  [ProductCondition.LIKE_NEW]: ItemCondition.LikeNew,
  [ProductCondition.REFURBISHED]: ItemCondition.Refurbished,
  [ProductCondition.USED_EXCELLENT]: ItemCondition.UsedExcellent,
  [ProductCondition.USED_VERY_GOOD]: ItemCondition.UsedVeryGood,
  [ProductCondition.USED_GOOD]: ItemCondition.UsedGood,
  [ProductCondition.USED_FAIR]: ItemCondition.UsedFair,
  [ProductCondition.FOR_PARTS]: ItemCondition.ForParts,
};

/** The product's condition as connectors take it; null when the product has none. */
export function toItemCondition(condition: ProductCondition | null): ItemCondition | null {
  return condition ? ITEM_CONDITIONS[condition] : null;
}
