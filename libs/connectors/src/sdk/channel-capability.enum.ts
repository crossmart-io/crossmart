/** What a connector can do. The sync orchestrator only calls capabilities a connector declares. */
export enum ChannelCapability {
  PublishListings = 'publish_listings',
  UpdateInventory = 'update_inventory',
  UpdatePrice = 'update_price',
  FetchOrders = 'fetch_orders',
  ReceiveWebhooks = 'receive_webhooks',
  PushFulfillment = 'push_fulfillment',
  ImportCatalog = 'import_catalog',
  ProvideTaxonomy = 'provide_taxonomy',
}
