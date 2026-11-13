import { ItemCondition } from '../../sdk/listings/item-condition.enum.js';
import { MercadoLibreCondition } from '../mercadolibre.enums.js';

/**
 * Mercado Libre's `condition` takes `new` or `used`. Only unused items are new; everything else,
 * refurbished included, is listed as used (refurbished listings need an `ITEM_CONDITION`
 * attribute and a 90-day warranty, which Crossmart does not have).
 */
const CONDITIONS: Readonly<Record<ItemCondition, MercadoLibreCondition>> = {
  [ItemCondition.New]: MercadoLibreCondition.New,
  [ItemCondition.NewOther]: MercadoLibreCondition.New,
  [ItemCondition.NewWithDefects]: MercadoLibreCondition.Used,
  [ItemCondition.LikeNew]: MercadoLibreCondition.Used,
  [ItemCondition.Refurbished]: MercadoLibreCondition.Used,
  [ItemCondition.UsedExcellent]: MercadoLibreCondition.Used,
  [ItemCondition.UsedVeryGood]: MercadoLibreCondition.Used,
  [ItemCondition.UsedGood]: MercadoLibreCondition.Used,
  [ItemCondition.UsedFair]: MercadoLibreCondition.Used,
  [ItemCondition.ForParts]: MercadoLibreCondition.Used,
};

/** The item's condition on Mercado Libre; new when the product has none. */
export function mercadoLibreCondition(
  condition: ItemCondition | null | undefined,
): MercadoLibreCondition {
  return condition ? CONDITIONS[condition] : MercadoLibreCondition.New;
}
