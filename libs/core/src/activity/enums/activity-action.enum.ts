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
  ProductsImported = 'products_imported',
  ProductViewCreated = 'product_view_created',
  ProductViewDeleted = 'product_view_deleted',
  ApiKeyCreated = 'api_key_created',
  ApiKeyRevoked = 'api_key_revoked',
}
