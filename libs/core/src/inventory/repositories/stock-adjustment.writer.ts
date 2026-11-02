import { Injectable } from '@nestjs/common';
import { type Prisma, PrismaService } from '@crossmart/database';
import type { StockAdjustment, StockSnapshot } from '../entities/stock-adjustment.js';

type Transaction = Prisma.TransactionClient;

/** Decides how many units an adjustment moves, given the locked stock. May throw to cancel. */
export type DeltaResolver = (stock: StockSnapshot) => number;

/**
 * Applies a stock adjustment in one transaction: the item row is locked, the change is
 * resolved against its current stock, then the stock and its ledger entry are written together.
 */
@Injectable()
export class StockAdjustmentWriter {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns false when the item is not in this workspace. */
  adjust(
    workspaceId: string,
    inventoryItemId: string,
    adjustment: StockAdjustment,
    resolveDelta: DeltaResolver,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const stock = await this.lock(tx, workspaceId, inventoryItemId);
      if (!stock) return false;
      const delta = resolveDelta(stock);
      if (delta !== 0) {
        await this.write(tx, { workspaceId, inventoryItemId, adjustment, stock, delta });
      }
      return true;
    });
  }

  private async lock(
    tx: Transaction,
    workspaceId: string,
    inventoryItemId: string,
  ): Promise<StockSnapshot | null> {
    const [stock] = await tx.$queryRaw<StockSnapshot[]>`
      SELECT tracked, available, reserved
      FROM inventory_items
      WHERE id = ${inventoryItemId}::uuid AND workspace_id = ${workspaceId}::uuid
      FOR UPDATE`;
    return stock ?? null;
  }

  private async write(tx: Transaction, change: ResolvedChange): Promise<void> {
    const { workspaceId, inventoryItemId, adjustment, stock, delta } = change;
    await tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data: { available: { increment: delta } },
    });
    await tx.inventoryMovement.create({
      data: {
        workspaceId,
        inventoryItemId,
        delta,
        reason: adjustment.reason,
        quantityAfter: stock.available + stock.reserved + delta,
        note: adjustment.note ?? null,
        actorUserId: adjustment.actor.userId,
        apiKeyId: adjustment.actor.apiKeyId,
      },
    });
  }
}

interface ResolvedChange {
  workspaceId: string;
  inventoryItemId: string;
  adjustment: StockAdjustment;
  stock: StockSnapshot;
  delta: number;
}
