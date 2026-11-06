import { Module } from '@nestjs/common';
import { AppConfigService } from '@crossmart/common';
import { ConnectorRuntimeModule } from '../sdk/connector-runtime.module.js';
import { EtsyShopReader } from './account/etsy-shop.reader.js';
import { EtsyApiClient } from './api/etsy-api.client.js';
import { EtsyConnector } from './etsy.connector.js';
import { EtsyApp } from './etsy-app.js';
import { EtsySellingServices, EtsySyncServices } from './etsy-capabilities.js';
import { EtsyInventorySync } from './inventory/etsy-inventory-sync.js';
import { EtsyOAuthClient } from './oauth/etsy-oauth.client.js';
import { EtsyOrderSource } from './orders/etsy-order-source.js';
import { EtsyImageClient } from './publish/etsy-image.client.js';
import { EtsyInventoryClient } from './publish/etsy-inventory.client.js';
import { EtsyListingClient } from './publish/etsy-listing.client.js';
import { EtsyListingImages } from './publish/etsy-listing-images.js';
import { EtsyListingPublisher } from './publish/etsy-listing-publisher.js';
import { EtsyPriceUpdater } from './publish/etsy-price-updater.js';
import { EtsyTaxonomyReader } from './taxonomy/etsy-taxonomy.reader.js';

/** The Etsy connector and its clients: shop, listings, images, inventory, taxonomy and orders. */
@Module({
  imports: [ConnectorRuntimeModule],
  providers: [
    {
      provide: EtsyApp,
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => new EtsyApp(appConfig.etsyApp),
    },
    EtsyOAuthClient,
    EtsyApiClient,
    EtsyShopReader,
    EtsyListingClient,
    EtsyInventoryClient,
    EtsyImageClient,
    EtsyListingImages,
    EtsyTaxonomyReader,
    EtsyListingPublisher,
    EtsyPriceUpdater,
    EtsySellingServices,
    EtsyOrderSource,
    EtsyInventorySync,
    EtsySyncServices,
    EtsyConnector,
  ],
  exports: [EtsyConnector],
})
export class EtsyConnectorModule {}
