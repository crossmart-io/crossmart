import { Module } from '@nestjs/common';
import { AppConfigService } from '@crossmart/common';
import { ConnectorRuntimeModule } from '../sdk/connector-runtime.module.js';
import { EbayBusinessPoliciesReader } from './account/ebay-business-policies.reader.js';
import { EbayIdentityReader } from './account/ebay-identity.reader.js';
import { EbayApiClient } from './api/ebay-api.client.js';
import { EbayConnector } from './ebay.connector.js';
import { EbayApp } from './ebay-app.js';
import { EbayOAuthClient } from './oauth/ebay-oauth.client.js';

/** The eBay connector and its clients. */
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
    EbayConnector,
  ],
  exports: [EbayConnector],
})
export class EbayConnectorModule {}
