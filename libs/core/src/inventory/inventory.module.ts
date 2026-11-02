import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module.js';
import { InventoryItemRepository } from './repositories/inventory-item.repository.js';
import { InventoryMovementRepository } from './repositories/inventory-movement.repository.js';
import { StockAdjustmentWriter } from './repositories/stock-adjustment.writer.js';
import { StockLevelsWriter } from './repositories/stock-levels.writer.js';
import { InventoryService } from './services/inventory.service.js';
import { StockAdjustmentService } from './services/stock-adjustment.service.js';
import { StockLevelsService } from './services/stock-levels.service.js';

/** Stock per variant, its ledger of movements, manual adjustments and bulk stock levels. */
@Module({
  imports: [ActivityModule],
  providers: [
    InventoryItemRepository,
    InventoryMovementRepository,
    StockAdjustmentWriter,
    StockLevelsWriter,
    InventoryService,
    StockAdjustmentService,
    StockLevelsService,
  ],
  exports: [InventoryService, StockAdjustmentService, StockLevelsService],
})
export class InventoryModule {}
