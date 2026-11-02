import { Module } from '@nestjs/common';
import { InventoryModule } from '@crossmart/core';
import { InventoryItemsController } from './controllers/inventory-items.controller.js';

@Module({
  imports: [InventoryModule],
  controllers: [InventoryItemsController],
})
export class InventoryApiModule {}
