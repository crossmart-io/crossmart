import { Injectable } from '@nestjs/common';
import { InventoryMovementReason } from '@crossmart/database';
import type { Actor } from '../../activity/entities/actor.js';
import { StockLevelsService } from '../../inventory/services/stock-levels.service.js';
import type { SaleStockItem } from '../entities/product-sale.js';
import { ProductSaleRepository } from '../repositories/product-sale.repository.js';

const SOLD_OUT = 0;

/** Tracked items that still have units to sell. */
function sellable(items: readonly SaleStockItem[]): SaleStockItem[] {
  return items.filter((item) => item.tracked && item.available > SOLD_OUT);
}

/**
 * Sets the available stock of a sold product's tracked variants to 0, through the ledger as
 * sold, so every store gets the new quantity. Units held for open orders stay held.
 */
@Injectable()
export class SoldStockClearer {
  constructor(
    private readonly sales: ProductSaleRepository,
    private readonly stock: StockLevelsService,
  ) {}

  /** Returns the units it cleared; 0 when nothing was left to sell. */
  async clear(workspaceId: string, productId: string, actor: Actor): Promise<number> {
    const items = sellable(await this.sales.findStock(workspaceId, productId));
    if (items.length === 0) return 0;
    const targets = items.map(({ inventoryItemId }) => ({ inventoryItemId, available: SOLD_OUT }));
    await this.stock.setAvailable(workspaceId, targets, {
      reason: InventoryMovementReason.SOLD,
      actor,
    });
    return items.reduce((sum, item) => sum + item.available, 0);
  }
}
