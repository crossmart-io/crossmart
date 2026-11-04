import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module.js';
import { ConnectorsModule } from '@crossmart/connectors';
import { ActivityModule } from '../activity/activity.module.js';
import { CredentialsModule } from '../credentials/credentials.module.js';
import { TenancyModule } from '../tenancy/tenancy.module.js';
import { ChannelConnectionRepository } from './repositories/channel-connection.repository.js';
import { ListingRepository } from './repositories/listing.repository.js';
import { ChannelAuthorizationService } from './services/channel-authorization.service.js';
import { ChannelConnectionsService } from './services/channel-connections.service.js';
import { ChannelSessionFactory } from './services/channel-session.factory.js';
import { ChannelWebhooksService } from './services/channel-webhooks.service.js';
import { ConnectedAccountWriter } from './services/connected-account.writer.js';
import { OAuthConnectorResolver } from './services/oauth-connector.resolver.js';
import { OAuthStateService } from './services/oauth-state.service.js';
import { ConnectionCredentialsVault } from './services/connection-credentials.vault.js';
import { OAuthStateSigner } from './services/oauth-state.signer.js';
import { ConnectionAccountStore } from './services/connection-account.store.js';
import { EbayAccountSetupService } from './ebay/services/ebay-account-setup.service.js';

/**
 * Channel connections: OAuth install, sealed credentials, sessions with token refresh,
 * webhooks, and the listing id mappings import and publish build on.
 */
@Module({
  imports: [ActivityModule, ConnectorsModule, CredentialsModule, EventsModule, TenancyModule],
  providers: [
    ChannelConnectionRepository,
    ListingRepository,
    ConnectionCredentialsVault,
    OAuthStateSigner,
    OAuthStateService,
    OAuthConnectorResolver,
    ConnectedAccountWriter,
    ChannelSessionFactory,
    ChannelAuthorizationService,
    ChannelConnectionsService,
    ChannelWebhooksService,
    ConnectionAccountStore,
    EbayAccountSetupService,
  ],
  exports: [
    ChannelAuthorizationService,
    ChannelConnectionsService,
    ChannelWebhooksService,
    EbayAccountSetupService,
    ChannelSessionFactory,
    ChannelConnectionRepository,
    ListingRepository,
    ConnectorsModule,
  ],
})
export class ChannelsModule {}
