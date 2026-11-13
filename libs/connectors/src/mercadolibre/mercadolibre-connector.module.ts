import { Module } from '@nestjs/common';
import { AppConfigService } from '@crossmart/common';
import { ConnectorRuntimeModule } from '../sdk/connector-runtime.module.js';
import { MercadoLibreUserReader } from './account/mercadolibre-user.reader.js';
import { MercadoLibreApiClient } from './api/mercadolibre-api.client.js';
import { MercadoLibreInventorySync } from './inventory/mercadolibre-inventory-sync.js';
import { MercadoLibreConnector } from './mercadolibre.connector.js';
import { MercadoLibreApp } from './mercadolibre-app.js';
import {
  MercadoLibreSellingServices,
  MercadoLibreSyncServices,
} from './mercadolibre-capabilities.js';
import { MercadoLibreNotificationParser } from './notifications/mercadolibre-notification.parser.js';
import { MercadoLibreOAuthClient } from './oauth/mercadolibre-oauth.client.js';
import { MercadoLibreOrderSource } from './orders/mercadolibre-order-source.js';
import { MercadoLibreItemClient } from './publish/mercadolibre-item.client.js';
import { MercadoLibreItemLifecycle } from './publish/mercadolibre-item-lifecycle.js';
import { MercadoLibreListingWriters } from './publish/mercadolibre-listing-writers.js';
import { MercadoLibreListingPublisher } from './publish/mercadolibre-listing-publisher.js';
import { MercadoLibrePriceUpdater } from './publish/mercadolibre-price-updater.js';
import { MercadoLibreSingleItemWriter } from './publish/mercadolibre-single-item.writer.js';
import { MercadoLibreUserProductWriter } from './publish/mercadolibre-user-product.writer.js';
import { MercadoLibreCategoryReader } from './taxonomy/mercadolibre-category.reader.js';
import { MercadoLibreCategoryAttributesReader } from './taxonomy/mercadolibre-category-attributes.reader.js';

/** The Mercado Libre connector and its clients: seller, categories, items, stock and orders. */
@Module({
  imports: [ConnectorRuntimeModule],
  providers: [
    {
      provide: MercadoLibreApp,
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => new MercadoLibreApp(appConfig.mercadoLibreApp),
    },
    MercadoLibreOAuthClient,
    MercadoLibreApiClient,
    MercadoLibreUserReader,
    MercadoLibreCategoryReader,
    MercadoLibreCategoryAttributesReader,
    MercadoLibreItemClient,
    MercadoLibreItemLifecycle,
    MercadoLibreSingleItemWriter,
    MercadoLibreUserProductWriter,
    MercadoLibreListingWriters,
    MercadoLibreListingPublisher,
    MercadoLibrePriceUpdater,
    MercadoLibreSellingServices,
    MercadoLibreOrderSource,
    MercadoLibreInventorySync,
    MercadoLibreNotificationParser,
    MercadoLibreSyncServices,
    MercadoLibreConnector,
  ],
  exports: [MercadoLibreConnector],
})
export class MercadoLibreConnectorModule {}
