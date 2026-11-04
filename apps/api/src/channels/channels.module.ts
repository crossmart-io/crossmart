import { Module } from '@nestjs/common';
import { ChannelsModule } from '@crossmart/core';
import { AuthModule } from '../auth/auth.module.js';
import { ChannelConnectionsController } from './controllers/channel-connections.controller.js';
import { ChannelOAuthController } from './controllers/channel-oauth.controller.js';
import { ChannelWebhooksController } from './controllers/channel-webhooks.controller.js';

@Module({
  imports: [ChannelsModule, AuthModule],
  controllers: [ChannelConnectionsController, ChannelOAuthController, ChannelWebhooksController],
})
export class ChannelsApiModule {}
