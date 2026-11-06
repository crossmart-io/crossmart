import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module.js';
import { EventsModule } from '../events/events.module.js';
import { WebhookOutboxModule } from '../webhooks/webhook-outbox.module.js';
import { InventoryLedger } from './repositories/inventory-ledger.js';
import { InventoryItemRepository } from './repositories/inventory-item.repository.js';
import { InventoryMovementRepository } from './repositories/inventory-movement.repository.js';
import { StockAdjustmentWriter } from './repositories/stock-adjustment.writer.js';
import { StockLevelsWriter } from './repositories/stock-levels.writer.js';
import { InventoryService } from './services/inventory.service.js';
import { StockAdjustmentService } from './services/stock-adjustment.service.js';
import { StockLevelsService } from './services/stock-levels.service.js';

/**
 * Stock per variant, its ledger of movements, manual adjustments and bulk stock levels.
 * `InventoryLedger` is the only writer of stock levels: orders and catalog edits use it too.
 */
@Module({
  imports: [ActivityModule, EventsModule, WebhookOutboxModule],
  providers: [
    InventoryLedger,
    InventoryItemRepository,
    InventoryMovementRepository,
    StockAdjustmentWriter,
    StockLevelsWriter,
    InventoryService,
    StockAdjustmentService,
    StockLevelsService,
  ],
  exports: [InventoryLedger, InventoryService, StockAdjustmentService, StockLevelsService],
})
export class InventoryModule {}
