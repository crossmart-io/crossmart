import { ChannelAuthStrategy } from '../channel-auth-strategy.enum.js';
import { ChannelCapability } from '../channel-capability.enum.js';
import type {
  ChannelConnector,
  OAuthAppConnector,
  SellerCredentialsConnector,
} from '../channel-connector.interface.js';
import type { CatalogSource } from './catalog-source.js';
import type { InventorySync } from './inventory-sync.js';
import type { ListingPublisher } from './listing-publisher.js';
import type { OrderSource } from './order-source.js';
import type { WebhookReceiver } from './webhook-receiver.js';

/** The interface each capability promises. A connector that declares one implements it. */
export interface CapabilityContracts {
  [ChannelCapability.ReceiveWebhooks]: WebhookReceiver;
  [ChannelCapability.ImportCatalog]: CatalogSource;
  [ChannelCapability.PublishListings]: ListingPublisher;
  [ChannelCapability.UpdatePrice]: ListingPublisher;
  [ChannelCapability.UpdateInventory]: InventorySync;
  [ChannelCapability.FetchOrders]: OrderSource;
}

export type ContractCapability = keyof CapabilityContracts;

/** Narrows a connector to a capability's interface when it declares that capability. */
export function supportsCapability<TCapability extends ContractCapability>(
  connector: ChannelConnector,
  capability: TCapability,
): connector is ChannelConnector & CapabilityContracts[TCapability] {
  return connector.capabilities.has(capability);
}

export function isOAuthAppConnector(connector: ChannelConnector): connector is OAuthAppConnector {
  return connector.authStrategy === ChannelAuthStrategy.OAuthApp;
}

export function isSellerCredentialsConnector(
  connector: ChannelConnector,
): connector is SellerCredentialsConnector {
  return connector.authStrategy === ChannelAuthStrategy.SellerCredentials;
}
