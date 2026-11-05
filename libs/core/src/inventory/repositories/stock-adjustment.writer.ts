import { Injectable } from '@nestjs/common';
import { PrismaService } from '@crossmart/database';
import type { StockAdjustment, StockSnapshot } from '../entities/stock-adjustment.js';
import { InventoryLedger } from './inventory-ledger.js';

/** Decides how many units an adjustment moves, given the locked stock. May throw to cancel. */
export type DeltaResolver = (stock: StockSnapshot) => number;

/**
 * Applies a stock adjustment in one transaction: the item row is locked, the change is
 * resolved against its current stock, then the ledger writes the stock and its entry together.
 */
@Injectable()
export class StockAdjustmentWriter {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: InventoryLedger,
  ) {}

  /** Returns the units moved (0 when nothing changed), or null when the item is not in this workspace. */
  adjust(
    workspaceId: string,
    inventoryItemId: string,
    adjustment: StockAdjustment,
    resolveDelta: DeltaResolver,
  ): Promise<number | null> {
    return this.prisma.$transaction(async (tx) => {
      const [stock] = await this.ledger.lockItems(tx, workspaceId, [inventoryItemId]);
      if (!stock) return null;
      const delta = resolveDelta(stock);
      const { reason, actor, note } = adjustment;
      await this.ledger.applyMovement(tx, workspaceId, {
        stock,
        availableDelta: delta,
        reservedDelta: 0,
        entry: { reason, actor, note },
      });
      return delta;
    });
  }
}
