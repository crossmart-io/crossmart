/**
 * An item's condition in Crossmart's terms, as a reseller grades it (ADR 0029). The values are
 * those of the catalog's `ProductCondition`, so connectors need not depend on the database.
 * Each connector maps it to its channel's own conditions, or ignores it when the channel has none.
 */
export enum ItemCondition {
  New = 'NEW',
  NewOther = 'NEW_OTHER',
  NewWithDefects = 'NEW_WITH_DEFECTS',
  LikeNew = 'LIKE_NEW',
  Refurbished = 'REFURBISHED',
  UsedExcellent = 'USED_EXCELLENT',
  UsedVeryGood = 'USED_VERY_GOOD',
  UsedGood = 'USED_GOOD',
  UsedFair = 'USED_FAIR',
  ForParts = 'FOR_PARTS',
}
