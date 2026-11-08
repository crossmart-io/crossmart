import { z } from 'zod';
import { InventoryMovementReason } from '@crossmart/database/generated/prisma/enums.js';
import { AgentToolName } from '../../../agent-tools/agent-tools.constants.js';
import { MOVEMENT_REASON_LABELS } from '../../../inventory/inventory.constants.js';
import { StockAdjustmentMode } from '../../../inventory/enums/stock-adjustment-mode.enum.js';
import type { AgentWorkerActionPreview } from '../../entities/agent-worker-views.js';
import type { ActionPreviewFormatter } from '../action-preview-formatter.js';
import {
  NOTE_PREFIX,
  OPTION_SEPARATOR,
  PREVIEW_HEADLINES,
  PREVIEW_LABELS,
  STOCK_REASON_PHRASES,
} from '../preview.constants.js';
import type { PreviewReader } from '../preview-reader.js';
import { change, variantName } from '../preview-values.js';

const INPUT = z.object({
  inventoryItemId: z.string(),
  mode: z.enum(StockAdjustmentMode),
  quantity: z.number().int(),
  reason: z.enum(InventoryMovementReason),
  note: z.string().optional(),
});
type StockAdjustment = z.infer<typeof INPUT>;

function headline({ mode, quantity, reason }: StockAdjustment): string {
  const phrase = STOCK_REASON_PHRASES[reason] ?? MOVEMENT_REASON_LABELS[reason];
  if (mode === StockAdjustmentMode.Set) return PREVIEW_HEADLINES.setStock(quantity, phrase);
  return quantity < 0
    ? PREVIEW_HEADLINES.removeStock(-quantity, phrase)
    : PREVIEW_HEADLINES.addStock(quantity, phrase);
}

function onHandAfter(onHand: number, { mode, quantity }: StockAdjustment): number {
  return mode === StockAdjustmentMode.Set ? quantity : onHand + quantity;
}

/** `adjust_stock`: "Add 20 units (stock received)", the variant, and on hand before and after. */
export class StockAdjustmentPreview implements ActionPreviewFormatter {
  readonly tool = AgentToolName.AdjustStock;

  async preview(
    input: Record<string, unknown>,
    reader: PreviewReader,
  ): Promise<AgentWorkerActionPreview> {
    const adjustment = INPUT.parse(input);
    const item = await reader.inventoryItem(adjustment.inventoryItemId);
    return {
      target: `${item.productTitle}${OPTION_SEPARATOR}${variantName(item)}`,
      headline: headline(adjustment),
      details: adjustment.note ? [`${NOTE_PREFIX}${adjustment.note}`] : [],
      changes: change(PREVIEW_LABELS.onHand, item.onHand, onHandAfter(item.onHand, adjustment)),
    };
  }
}
