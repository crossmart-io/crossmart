import { Module } from '@nestjs/common';
import { RedisModule } from '@crossmart/common';
import { EventsModule } from '../events/events.module.js';
import { ConnectorsModule } from '@crossmart/connectors';
import { ActivityModule } from '../activity/activity.module.js';
import { EntitlementsModule } from '../entitlements/entitlements.module.js';
import { CredentialsModule } from '../credentials/credentials.module.js';
import { TenancyModule } from '../tenancy/tenancy.module.js';
import { ChannelConnectionRepository } from './repositories/channel-connection.repository.js';
import { ListingRepository } from './repositories/listing.repository.js';
import { ChannelAuthorizationService } from './services/channel-authorization.service.js';
import { ChannelConnectionsService } from './services/channel-connections.service.js';
import { ChannelSessionFactory } from './services/channel-session.factory.js';
import { ChannelWebhookDispatcher } from './services/channel-webhook.dispatcher.js';
import { ChannelWebhooksService } from './services/channel-webhooks.service.js';
import { ChannelConnectionQuota } from './services/channel-connection.quota.js';
import { ConnectedAccountWriter } from './services/connected-account.writer.js';
import { OAuthConnectorResolver } from './services/oauth-connector.resolver.js';
import { OAuthStateService } from './services/oauth-state.service.js';
import { ConnectionCredentialsVault } from './services/connection-credentials.vault.js';
import { OAuthStateSigner } from './services/oauth-state.signer.js';
import { ConnectionAccountStore } from './services/connection-account.store.js';
import { EbayAccountPurger } from './ebay/services/ebay-account.purger.js';
import { EbayAccountDeletionService } from './ebay/services/ebay-account-deletion.service.js';
import { EbayAccountSetupService } from './ebay/services/ebay-account-setup.service.js';
import { EbayDeletionChallengeService } from './ebay/services/ebay-deletion-challenge.service.js';
import { GoogleMerchantSetupService } from './google-merchant/services/google-merchant-setup.service.js';
import { EtsyShopSetupService } from './etsy/services/etsy-shop-setup.service.js';

/**
 * Channel connections: OAuth install, sealed credentials, sessions with token refresh,
 * webhooks, and the listing id mappings import and publish build on.
 */
@Module({
  imports: [
    ActivityModule,
    ConnectorsModule,
    CredentialsModule,
    EntitlementsModule,
    EventsModule,
    RedisModule,
    TenancyModule,
  ],
  providers: [
    ChannelConnectionRepository,
    ListingRepository,
    ConnectionCredentialsVault,
    OAuthStateSigner,
    OAuthStateService,
    OAuthConnectorResolver,
    ChannelConnectionQuota,
    ConnectedAccountWriter,
    ChannelSessionFactory,
    ChannelAuthorizationService,
    ChannelConnectionsService,
    ChannelWebhookDispatcher,
    ChannelWebhooksService,
    ConnectionAccountStore,
    EbayAccountSetupService,
    EbayAccountPurger,
    EbayAccountDeletionService,
    EbayDeletionChallengeService,
    GoogleMerchantSetupService,
    EtsyShopSetupService,
  ],
  exports: [
    ChannelAuthorizationService,
    ChannelConnectionsService,
    ChannelWebhooksService,
    EbayAccountSetupService,
    EbayAccountDeletionService,
    EbayDeletionChallengeService,
    GoogleMerchantSetupService,
    EtsyShopSetupService,
    ChannelSessionFactory,
    ChannelConnectionRepository,
    ListingRepository,
    ConnectorsModule,
  ],
})
export class ChannelsModule {}
