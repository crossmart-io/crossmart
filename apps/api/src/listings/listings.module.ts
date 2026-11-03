import { Module } from '@nestjs/common';
import { ChannelsModule, ListingsModule } from '@crossmart/core';
import { AuthModule } from '../auth/auth.module.js';
import { ChannelRulesController } from './controllers/channel-rules.controller.js';
import { ChannelSyncController } from './controllers/channel-sync.controller.js';
import { ProductChannelsController } from './controllers/product-channels.controller.js';

@Module({
  imports: [ListingsModule, ChannelsModule, AuthModule],
  controllers: [ChannelRulesController, ChannelSyncController, ProductChannelsController],
})
export class ListingsApiModule {}
