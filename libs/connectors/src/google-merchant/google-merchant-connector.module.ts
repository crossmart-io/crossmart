import { Module } from '@nestjs/common';
import { AppConfigService } from '@crossmart/common';
import { ConnectorRuntimeModule } from '../sdk/connector-runtime.module.js';
import { GoogleAccountReader } from './account/google-account.reader.js';
import { GoogleDataSourceWriter } from './account/google-data-source.writer.js';
import { GoogleMerchantApiClient } from './api/google-merchant-api.client.js';
import { GoogleMerchantConnector } from './google-merchant.connector.js';
import { GoogleMerchantApp } from './google-merchant-app.js';
import { GoogleOAuthClient } from './oauth/google-oauth.client.js';
import { GoogleListingPublisher } from './publish/google-listing-publisher.js';
import { GoogleProductInputsClient } from './publish/google-product-inputs.client.js';

/** The Google Merchant Center connector and its Merchant API clients. */
@Module({
  imports: [ConnectorRuntimeModule],
  providers: [
    {
      provide: GoogleMerchantApp,
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => new GoogleMerchantApp(appConfig.googleApp),
    },
    GoogleOAuthClient,
    GoogleMerchantApiClient,
    GoogleAccountReader,
    GoogleDataSourceWriter,
    GoogleProductInputsClient,
    GoogleListingPublisher,
    GoogleMerchantConnector,
  ],
  exports: [GoogleMerchantConnector],
})
export class GoogleMerchantConnectorModule {}
