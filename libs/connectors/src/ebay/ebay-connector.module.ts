import { Module } from '@nestjs/common';
import { AppConfigService } from '@crossmart/common';
import { ConnectorRuntimeModule } from '../sdk/connector-runtime.module.js';
import { EbayBusinessPoliciesOptIn } from './account/ebay-business-policies.opt-in.js';
import { EbayBusinessPoliciesReader } from './account/ebay-business-policies.reader.js';
import { EbayBusinessPoliciesWriter } from './account/ebay-business-policies.writer.js';
import { EbayIdentityReader } from './account/ebay-identity.reader.js';
import { EbayLocationWriter } from './account/ebay-location.writer.js';
import { EbayApiClient } from './api/ebay-api.client.js';
import { EbayConnector } from './ebay.connector.js';
import { EbayApp } from './ebay-app.js';
import { EbayAccountServices, EbaySellingServices } from './ebay-capabilities.js';
import { EbayOAuthClient } from './oauth/ebay-oauth.client.js';
import { EbayInventoryClient } from './publish/ebay-inventory.client.js';
import { EbayListingPublisher } from './publish/ebay-listing-publisher.js';
import { EbayOfferClient } from './publish/ebay-offer.client.js';
import { EbayPriceUpdater } from './publish/ebay-price-updater.js';
import { EbayTaxonomyReader } from './taxonomy/ebay-taxonomy.reader.js';

/** The eBay connector and its clients: account, listings and taxonomy. */
@Module({
  imports: [ConnectorRuntimeModule],
  providers: [
    {
      provide: EbayApp,
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => new EbayApp(appConfig.ebayApp),
    },
    EbayOAuthClient,
    EbayApiClient,
    EbayIdentityReader,
    EbayBusinessPoliciesReader,
    EbayBusinessPoliciesOptIn,
    EbayBusinessPoliciesWriter,
    EbayLocationWriter,
    EbayAccountServices,
    EbayInventoryClient,
    EbayOfferClient,
    EbayPriceUpdater,
    EbayTaxonomyReader,
    EbayListingPublisher,
    EbaySellingServices,
    EbayConnector,
  ],
  exports: [EbayConnector],
})
export class EbayConnectorModule {}
