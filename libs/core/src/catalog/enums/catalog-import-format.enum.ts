/** File formats the catalog can import. */
export enum CatalogImportFormat {
  ShopifyCsv = 'shopify_csv',
  /** A two-column `sku,available` sheet for stock updates. */
  InventoryCsv = 'inventory_csv',
  /** A connected Shopify store's catalog, read through the Admin API. */
  ShopifyApi = 'shopify_api',
}
