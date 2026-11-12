import { Module } from '@nestjs/common';
import { ConnectorRuntimeModule } from '../sdk/connector-runtime.module.js';
import { FalabellaAccountVerifier } from './account/falabella-account.verifier.js';
import { FalabellaApiClient } from './api/falabella-api.client.js';
import { FalabellaConnector } from './falabella.connector.js';
import { FalabellaSellingServices, FalabellaSyncServices } from './falabella-capabilities.js';
import { FalabellaFeedClient } from './feeds/falabella-feed.client.js';
import { FalabellaInventorySync } from './inventory/falabella-inventory-sync.js';
import { FalabellaOrderSource } from './orders/falabella-order-source.js';
import { FalabellaListingPublisher } from './publish/falabella-listing-publisher.js';
import { FalabellaPriceUpdater } from './publish/falabella-price-updater.js';
import { FalabellaProductLookup } from './publish/falabella-product-lookup.js';
import { FalabellaTaxonomyReader } from './taxonomy/falabella-taxonomy.reader.js';

/** The Falabella connector and its clients: account, taxonomy, feeds, products and orders. */
@Module({
  imports: [ConnectorRuntimeModule],
  providers: [
    FalabellaApiClient,
    FalabellaAccountVerifier,
    FalabellaFeedClient,
    FalabellaTaxonomyReader,
    FalabellaProductLookup,
    FalabellaListingPublisher,
    FalabellaPriceUpdater,
    FalabellaInventorySync,
    FalabellaOrderSource,
    FalabellaSellingServices,
    FalabellaSyncServices,
    FalabellaConnector,
  ],
  exports: [FalabellaConnector],
})
export class FalabellaConnectorModule {}
