import { OPTION_VALUE_SEPARATOR } from '../../inventory/inventory.constants.js';

const DEFAULT_VARIANT_TITLE = 'Default';

/** How a variant is named in lists: its option values, else its SKU. */
export function variantTitle(variant: { optionValues: string[]; sku: string | null }): string {
  if (variant.optionValues.length > 0) return variant.optionValues.join(OPTION_VALUE_SEPARATOR);
  return variant.sku ?? DEFAULT_VARIANT_TITLE;
}
