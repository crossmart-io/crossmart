import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { mercadoLibreError } from '../mercadolibre-errors.js';
import { parseVariantKey } from './mercadolibre-keys.js';
import type { MercadoLibreItem, MercadoLibreVariationUpdate } from './mercadolibre-item.types.js';

const NOT_A_VARIANT_KEY = 'This is not a Mercado Libre item or variation';

/** The changes to one item: to the item itself, or to some of its variations by id. */
export interface ItemChanges<TValue> {
  itemId: string;
  /** The change to an item without variations; null when the changes are to variations. */
  itemValue: TValue | null;
  variationValues: Map<number, TValue>;
}

/** Groups changes keyed by variant key per item, so each item is written once. */
export function groupByItem<TValue>(
  changes: readonly { key: string; value: TValue }[],
): ItemChanges<TValue>[] {
  const groups = new Map<string, ItemChanges<TValue>>();
  for (const { key, value } of changes) {
    const parsed = parseVariantKey(key);
    if (!parsed) throw mercadoLibreError(ChannelErrorCode.RequestRejected, NOT_A_VARIANT_KEY);
    const group = groups.get(parsed.itemId) ?? {
      itemId: parsed.itemId,
      itemValue: null,
      variationValues: new Map<number, TValue>(),
    };
    if (parsed.variationId === null) group.itemValue = value;
    else group.variationValues.set(parsed.variationId, value);
    groups.set(parsed.itemId, group);
  }
  return [...groups.values()];
}

/**
 * Every variation of the item, changed or not: a `PUT` that leaves a variation out deletes it
 * (Variations guide), so the untouched ones are sent by id alone.
 */
export function allVariations(
  item: MercadoLibreItem,
  change: (variationId: number) => Omit<MercadoLibreVariationUpdate, 'id'>,
): MercadoLibreVariationUpdate[] {
  return item.variations.map(({ id }) => ({ id, ...change(id) }));
}
