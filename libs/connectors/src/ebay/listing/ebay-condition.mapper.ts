import { ItemCondition } from '../../sdk/listings/item-condition.enum.js';
import { EbayCondition } from './ebay-condition.enum.js';

/**
 * The eBay condition each Crossmart condition is listed in (ADR 0029). eBay names the same
 * grades per category ("New with tags" is `NEW` in clothing), and a category that does not accept
 * one refuses the listing with eBay's own message.
 */
const EBAY_CONDITIONS: Readonly<Record<ItemCondition, EbayCondition>> = {
  [ItemCondition.New]: EbayCondition.New,
  [ItemCondition.NewOther]: EbayCondition.NewOther,
  [ItemCondition.NewWithDefects]: EbayCondition.NewWithDefects,
  [ItemCondition.LikeNew]: EbayCondition.LikeNew,
  [ItemCondition.Refurbished]: EbayCondition.SellerRefurbished,
  [ItemCondition.UsedExcellent]: EbayCondition.UsedExcellent,
  [ItemCondition.UsedVeryGood]: EbayCondition.UsedVeryGood,
  [ItemCondition.UsedGood]: EbayCondition.UsedGood,
  [ItemCondition.UsedFair]: EbayCondition.UsedAcceptable,
  [ItemCondition.ForParts]: EbayCondition.ForPartsOrNotWorking,
};

/** The product's condition on eBay, or the connection's default when the product has none. */
export function ebayConditionOf(
  condition: ItemCondition | null | undefined,
  fallback: EbayCondition,
): EbayCondition {
  return condition ? EBAY_CONDITIONS[condition] : fallback;
}
