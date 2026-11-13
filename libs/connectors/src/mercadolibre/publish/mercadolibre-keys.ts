import { MERCADOLIBRE_VARIATION_ID_SEPARATOR } from '../mercadolibre.constants.js';

const ITEM_ID_PATTERN = /^[A-Z]{3}\d+$/;
const VARIATION_ID_PATTERN = /^\d+$/;

/**
 * Where a variant's stock and price live on Mercado Libre: its own item (`MLM123`, User
 * Products and single-variant items), or a variation of an item (`MLM123:456`).
 */
export interface MercadoLibreVariantKey {
  itemId: string;
  variationId: number | null;
}

export function formatVariantKey({ itemId, variationId }: MercadoLibreVariantKey): string {
  return variationId === null
    ? itemId
    : `${itemId}${MERCADOLIBRE_VARIATION_ID_SEPARATOR}${variationId}`;
}

/** The parts of a stored variant key, or null when it is not one. */
export function parseVariantKey(key: string): MercadoLibreVariantKey | null {
  const [itemId = '', variationId, ...rest] = key.split(MERCADOLIBRE_VARIATION_ID_SEPARATOR);
  if (!ITEM_ID_PATTERN.test(itemId) || rest.length > 0) return null;
  if (variationId === undefined) return { itemId, variationId: null };
  return VARIATION_ID_PATTERN.test(variationId)
    ? { itemId, variationId: Number(variationId) }
    : null;
}

/** Whether a listing's variants are variations of one item, as published before. */
export function hasVariationKeys(keys: readonly (string | null | undefined)[]): boolean {
  return keys.some((key) => {
    const variationId = key ? parseVariantKey(key)?.variationId : null;
    return typeof variationId === 'number';
  });
}
