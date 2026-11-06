import { Module } from '@nestjs/common';
import { ChannelsModule, ListingsModule } from '@crossmart/core';
import { AuthModule } from '../auth/auth.module.js';
import { ChannelProductsController } from './controllers/channel-products.controller.js';
import { ChannelRulesController } from './controllers/channel-rules.controller.js';
import { ChannelSelectionController } from './controllers/channel-selection.controller.js';
import { ChannelSyncController } from './controllers/channel-sync.controller.js';
import { ProductChannelsController } from './controllers/product-channels.controller.js';
import { ListingEditorController } from './controllers/listing-editor.controller.js';
import { ProductChannelCategoryController } from './controllers/product-channel-category.controller.js';
import { ProductChannelItemSpecificsController } from './controllers/product-channel-item-specifics.controller.js';
import { StoreProductsController } from './controllers/store-products.controller.js';

@Module({
  imports: [ListingsModule, ChannelsModule, AuthModule],
  controllers: [
    ChannelProductsController,
    ChannelRulesController,
    ChannelSelectionController,
    ChannelSyncController,
    StoreProductsController,
    ProductChannelsController,
    ListingEditorController,
    ProductChannelCategoryController,
    ProductChannelItemSpecificsController,
  ],
})
export class ListingsApiModule {}
