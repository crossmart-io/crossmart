/** The kind of record an activity event is about. Stored as text, like `ActivityAction`. */
export enum ActivitySubjectType {
  Product = 'product',
  ProductView = 'product_view',
  CatalogImport = 'catalog_import',
  ApiKey = 'api_key',
}
