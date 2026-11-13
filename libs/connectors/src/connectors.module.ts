import { Module } from '@nestjs/common';
import type { ChannelConnector } from './sdk/channel-connector.interface.js';
import { ChannelConnectorRegistry } from './sdk/registry/channel-connector.registry.js';
import { CHANNEL_CONNECTORS } from './sdk/registry/connectors.constants.js';
import { EbayConnector } from './ebay/ebay.connector.js';
import { EbayConnectorModule } from './ebay/ebay-connector.module.js';
import { EtsyConnector } from './etsy/etsy.connector.js';
import { EtsyConnectorModule } from './etsy/etsy-connector.module.js';
import { MercadoLibreConnector } from './mercadolibre/mercadolibre.connector.js';
import { MercadoLibreConnectorModule } from './mercadolibre/mercadolibre-connector.module.js';
import { FalabellaConnector } from './falabella/falabella.connector.js';
import { FalabellaConnectorModule } from './falabella/falabella-connector.module.js';
import { GoogleMerchantConnector } from './google-merchant/google-merchant.connector.js';
import { GoogleMerchantConnectorModule } from './google-merchant/google-merchant-connector.module.js';
import { ShopifyConnector } from './shopify/shopify.connector.js';
import { ShopifyConnectorModule } from './shopify/shopify-connector.module.js';

/**
 * Every connector this instance ships, served by `ChannelConnectorRegistry`. A new channel is
 * its module in `imports` and its connector in the factory below.
 */
@Module({
  imports: [
    ShopifyConnectorModule,
    EbayConnectorModule,
    GoogleMerchantConnectorModule,
    EtsyConnectorModule,
    MercadoLibreConnectorModule,
    FalabellaConnectorModule,
  ],
  providers: [
    {
      provide: CHANNEL_CONNECTORS,
      inject: [
        ShopifyConnector,
        EbayConnector,
        GoogleMerchantConnector,
        EtsyConnector,
        MercadoLibreConnector,
        FalabellaConnector,
      ],
      useFactory: (...connectors: ChannelConnector[]): ChannelConnector[] => connectors,
    },
    ChannelConnectorRegistry,
  ],
  exports: [
    ChannelConnectorRegistry,
    ShopifyConnectorModule,
    EbayConnectorModule,
    GoogleMerchantConnectorModule,
    EtsyConnectorModule,
    MercadoLibreConnectorModule,
    FalabellaConnectorModule,
  ],
})
export class ConnectorsModule {}
