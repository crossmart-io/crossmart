import { Module } from '@nestjs/common';
import { ChannelImportModule, ChannelsModule, ListingsModule } from '@crossmart/core';
import { AuthModule } from '../auth/auth.module.js';
import { ChannelImportsController } from './controllers/channel-imports.controller.js';
import { ChannelConnectionsController } from './controllers/channel-connections.controller.js';
import { ChannelCredentialsController } from './controllers/channel-credentials.controller.js';
import { ChannelOAuthController } from './controllers/channel-oauth.controller.js';
import { ChannelWebhooksController } from './controllers/channel-webhooks.controller.js';
import { EbayAccountController } from './controllers/ebay-account.controller.js';
import { EbayAccountDeletionController } from './controllers/ebay-account-deletion.controller.js';
import { EtsyShopController } from './controllers/etsy-shop.controller.js';
import { GoogleMerchantAccountController } from './controllers/google-merchant-account.controller.js';
import { OAuthNonceCookie } from './services/oauth-nonce.cookie.js';

@Module({
  imports: [ChannelsModule, ChannelImportModule, ListingsModule, AuthModule],
  controllers: [
    ChannelConnectionsController,
    ChannelCredentialsController,
    ChannelImportsController,
    ChannelOAuthController,
    ChannelWebhooksController,
    EbayAccountController,
    EbayAccountDeletionController,
    GoogleMerchantAccountController,
    EtsyShopController,
  ],
  providers: [OAuthNonceCookie],
})
export class ChannelsApiModule {}
