import { Module } from '@nestjs/common';
import type { ChannelConnector } from './sdk/channel-connector.interface.js';
import { ChannelConnectorRegistry } from './sdk/registry/channel-connector.registry.js';
import { CHANNEL_CONNECTORS } from './sdk/registry/connectors.constants.js';
import { ShopifyConnector } from './shopify/shopify.connector.js';
import { ShopifyConnectorModule } from './shopify/shopify-connector.module.js';

/**
 * Every connector this instance ships, served by `ChannelConnectorRegistry`. A new channel is
 * its module in `imports` and its connector in the factory below.
 */
@Module({
  imports: [ShopifyConnectorModule],
  providers: [
    {
      provide: CHANNEL_CONNECTORS,
      inject: [ShopifyConnector],
      useFactory: (shopify: ShopifyConnector): ChannelConnector[] => [shopify],
    },
    ChannelConnectorRegistry,
  ],
  exports: [ChannelConnectorRegistry, ShopifyConnectorModule],
})
export class ConnectorsModule {}
