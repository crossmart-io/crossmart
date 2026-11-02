import { Module } from '@nestjs/common';
import { InventoryItemRepository } from './repositories/inventory-item.repository.js';
import { InventoryMovementRepository } from './repositories/inventory-movement.repository.js';
import { StockAdjustmentWriter } from './repositories/stock-adjustment.writer.js';
import { InventoryService } from './services/inventory.service.js';
import { StockAdjustmentService } from './services/stock-adjustment.service.js';

/** Stock per variant, its ledger of movements, and manual adjustments. */
@Module({
  providers: [
    InventoryItemRepository,
    InventoryMovementRepository,
    StockAdjustmentWriter,
    InventoryService,
    StockAdjustmentService,
  ],
  exports: [InventoryService, StockAdjustmentService],
})
export class InventoryModule {}
