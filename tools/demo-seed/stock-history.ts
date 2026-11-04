import type { SeededRandom } from './seeded-random.js';

/** The `POST /inventory-items/{id}/adjustments` body, as the API documents it. */
export interface StockAdjustmentBody {
  mode: StockAdjustmentModeValue;
  quantity: number;
  reason: StockAdjustmentReasonValue;
  note?: string;
}

export enum StockAdjustmentModeValue {
  Delta = 'delta',
  Set = 'set',
}

export enum StockAdjustmentReasonValue {
  Received = 'RECEIVED',
  Sold = 'SOLD',
  Damaged = 'DAMAGED',
  Correction = 'CORRECTION',
}

/** How often each step of a variant's demo history happens. */
const HISTORY_MIX = {
  hasHistory: 0.35,
  sold: 0.6,
  damaged: 0.25,
  counted: 0.3,
} as const;

const MIN_RECEIVED = 6;
const MAX_RECEIVED = 24;
const MAX_SOLD = 4;
const MAX_COUNT_DRIFT = 2;
const DELIVERY_NOTES = ['Spring delivery', 'Restock from the workshop', 'PO 1042', 'PO 1057'];
const SOLD_NOTE = 'Weekend market stall';
const DAMAGED_NOTE = 'Damaged in transit';
const COUNT_NOTE = 'Monthly stock count';

/** A short, plausible stock history for some variants: a delivery, a few sales, a count. */
export function stockHistoryFor(onHand: number, random: SeededRandom): StockAdjustmentBody[] {
  if (!random.chance(HISTORY_MIX.hasHistory)) return [];
  const received = random.integer(MIN_RECEIVED, MAX_RECEIVED);
  const history: StockAdjustmentBody[] = [
    delta(received, StockAdjustmentReasonValue.Received, random.pick(DELIVERY_NOTES)),
  ];
  let stock = onHand + received;
  if (random.chance(HISTORY_MIX.sold)) {
    const sold = random.integer(1, Math.min(MAX_SOLD, stock));
    history.push(delta(-sold, StockAdjustmentReasonValue.Sold, SOLD_NOTE));
    stock -= sold;
  }
  if (stock > 0 && random.chance(HISTORY_MIX.damaged)) {
    history.push(delta(-1, StockAdjustmentReasonValue.Damaged, DAMAGED_NOTE));
    stock -= 1;
  }
  if (random.chance(HISTORY_MIX.counted)) {
    const counted = Math.max(0, stock + random.integer(-MAX_COUNT_DRIFT, MAX_COUNT_DRIFT));
    history.push({
      mode: StockAdjustmentModeValue.Set,
      quantity: counted,
      reason: StockAdjustmentReasonValue.Correction,
      note: COUNT_NOTE,
    });
  }
  return history;
}

function delta(
  quantity: number,
  reason: StockAdjustmentReasonValue,
  note: string,
): StockAdjustmentBody {
  return { mode: StockAdjustmentModeValue.Delta, quantity, reason, note };
}
