import type { InventoryMovementReason } from '@crossmart/database';
import { MOVEMENT_REASON_LABELS, OPTION_VALUE_SEPARATOR } from '../inventory.constants.js';

export interface StockChange {
  sku: string | null;
  optionValues: string[];
  delta: number;
  reason: InventoryMovementReason;
}

const signFormat = new Intl.NumberFormat('en', { signDisplay: 'exceptZero' });

/** The variant, the signed change and the reason, for an activity summary: "MUG-BLUE +5, received". */
export function describeStockChange(change: StockChange): string {
  const variant = change.sku ?? change.optionValues.join(OPTION_VALUE_SEPARATOR);
  const quantity = signFormat.format(change.delta);
  const movement = variant ? `${variant} ${quantity}` : quantity;
  return `${movement}, ${MOVEMENT_REASON_LABELS[change.reason]}`;
}
