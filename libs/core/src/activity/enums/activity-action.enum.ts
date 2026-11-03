/**
 * What happened. Stored as text, so a feature adds an action here (and its summary in
 * `activity-summary.ts`) without a migration.
 */
export enum ActivityAction {
  ProductCreated = 'product_created',
  ProductUpdated = 'product_updated',
  ProductDeleted = 'product_deleted',
  ProductsBulkUpdated = 'products_bulk_updated',
  ProductsBulkDeleted = 'products_bulk_deleted',
  /** A create import: new products from a file. */
  ProductsImported = 'products_imported',
  /** An update import: catalog products replaced from a file. */
  ProductsUpdatedByImport = 'products_updated_by_import',
  /** An inventory import: stock levels set from a file. */
  StockImported = 'stock_imported',
  /** A channel import: products created or linked from a connected store's catalog. */
  ChannelCatalogImported = 'channel_catalog_imported',
  ProductViewCreated = 'product_view_created',
  ProductViewDeleted = 'product_view_deleted',
  ApiKeyCreated = 'api_key_created',
  ApiKeyRevoked = 'api_key_revoked',
  InventoryAdjusted = 'inventory_adjusted',
  /** A channel account (a Shopify store) was connected, or connected again. */
  ChannelConnected = 'channel_connected',
  /** By the merchant, or by the channel when the app was uninstalled. */
  ChannelDisconnected = 'channel_disconnected',
  ChannelConnectFailed = 'channel_connect_failed',
}
