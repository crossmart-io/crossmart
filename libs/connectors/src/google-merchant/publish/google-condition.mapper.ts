import { ItemCondition } from '../../sdk/listings/item-condition.enum.js';
import { GoogleCondition } from './google-product-input.js';

/**
 * The Google condition each Crossmart condition is listed in (ADR 0029). Google has three:
 * `new` is "brand new, in its original unopened packaging", so new items without their tags or
 * packaging, or with defects, are `used`, as everything worn is.
 */
const GOOGLE_CONDITIONS: Readonly<Record<ItemCondition, GoogleCondition>> = {
  [ItemCondition.New]: GoogleCondition.New,
  [ItemCondition.NewOther]: GoogleCondition.Used,
  [ItemCondition.NewWithDefects]: GoogleCondition.Used,
  [ItemCondition.LikeNew]: GoogleCondition.Used,
  [ItemCondition.Refurbished]: GoogleCondition.Refurbished,
  [ItemCondition.UsedExcellent]: GoogleCondition.Used,
  [ItemCondition.UsedVeryGood]: GoogleCondition.Used,
  [ItemCondition.UsedGood]: GoogleCondition.Used,
  [ItemCondition.UsedFair]: GoogleCondition.Used,
  [ItemCondition.ForParts]: GoogleCondition.Used,
};

/** The product's condition on Google; a product without one is new, as before conditions. */
export function googleConditionOf(condition: ItemCondition | null | undefined): GoogleCondition {
  return condition ? GOOGLE_CONDITIONS[condition] : GoogleCondition.New;
}
