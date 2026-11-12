import { ItemCondition } from '../../sdk/listings/item-condition.enum.js';
import { FalabellaCondition } from '../falabella.enums.js';

/**
 * Crossmart's conditions in Falabella's three: new, used and refurbished. Anything worn or
 * flawed is used; Falabella has no grades. A product without a condition is new.
 */
const CONDITIONS: Readonly<Record<ItemCondition, FalabellaCondition>> = {
  [ItemCondition.New]: FalabellaCondition.New,
  [ItemCondition.NewOther]: FalabellaCondition.New,
  [ItemCondition.NewWithDefects]: FalabellaCondition.Used,
  [ItemCondition.LikeNew]: FalabellaCondition.Used,
  [ItemCondition.Refurbished]: FalabellaCondition.Refurbished,
  [ItemCondition.UsedExcellent]: FalabellaCondition.Used,
  [ItemCondition.UsedVeryGood]: FalabellaCondition.Used,
  [ItemCondition.UsedGood]: FalabellaCondition.Used,
  [ItemCondition.UsedFair]: FalabellaCondition.Used,
  [ItemCondition.ForParts]: FalabellaCondition.Used,
};

export function toFalabellaCondition(condition: ItemCondition | null | undefined): string {
  return CONDITIONS[condition ?? ItemCondition.New];
}
