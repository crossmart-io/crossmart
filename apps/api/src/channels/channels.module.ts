import { Module } from '@nestjs/common';
import { ChannelImportModule, ChannelsModule, ListingsModule } from '@crossmart/core';
import { AuthModule } from '../auth/auth.module.js';
import { ChannelImportsController } from './controllers/channel-imports.controller.js';
import { ChannelConnectionsController } from './controllers/channel-connections.controller.js';
import { ChannelOAuthController } from './controllers/channel-oauth.controller.js';
import { ChannelWebhooksController } from './controllers/channel-webhooks.controller.js';

@Module({
  imports: [ChannelsModule, ChannelImportModule, ListingsModule, AuthModule],
  controllers: [
    ChannelConnectionsController,
    ChannelImportsController,
    ChannelOAuthController,
    ChannelWebhooksController,
  ],
})
export class ChannelsApiModule {}
