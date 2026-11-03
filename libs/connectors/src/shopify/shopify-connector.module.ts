import { Module } from '@nestjs/common';
import { AppConfigService } from '@crossmart/common';
import { ConnectorRuntimeModule } from '../sdk/connector-runtime.module.js';
import { ShopifyCatalogReader } from './catalog/shopify-catalog.reader.js';
import { ShopifyAdminClient } from './graphql/shopify-admin.client.js';
import { ShopifyInventorySync } from './inventory/shopify-inventory-sync.js';
import { ShopifyLocations } from './inventory/shopify-locations.js';
import { ShopifyOAuthClient } from './oauth/shopify-oauth.client.js';
import { ShopifyListingPublisher } from './publish/shopify-listing-publisher.js';
import { ShopifyConnector } from './shopify.connector.js';
import { ShopifyApp } from './shopify-app.js';
import { ShopifyListingCapabilities } from './shopify-listing-capabilities.js';
import { ShopifySignatures } from './shopify-signatures.js';
import { ShopifyWebhookParser } from './webhooks/shopify-webhook-parser.js';

/** The Shopify connector and its clients. `ShopifyAdminClient` is exported for later capabilities. */
@Module({
  imports: [ConnectorRuntimeModule],
  providers: [
    {
      provide: ShopifyApp,
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => new ShopifyApp(appConfig.shopifyApp),
    },
    ShopifySignatures,
    ShopifyOAuthClient,
    ShopifyAdminClient,
    ShopifyWebhookParser,
    ShopifyCatalogReader,
    ShopifyLocations,
    ShopifyListingPublisher,
    ShopifyInventorySync,
    ShopifyListingCapabilities,
    ShopifyConnector,
  ],
  exports: [ShopifyConnector, ShopifyAdminClient],
})
export class ShopifyConnectorModule {}
