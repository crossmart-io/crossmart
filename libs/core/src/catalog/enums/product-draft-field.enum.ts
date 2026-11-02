/**
 * A field of a product or of its variants that an import file can carry. An update import
 * changes only the fields its file has columns for.
 */
export enum ProductDraftField {
  Title = 'title',
  Description = 'description',
  Vendor = 'vendor',
  ProductType = 'product_type',
  Tags = 'tags',
  Status = 'status',
  /** The option names, together with each variant's option values. */
  Options = 'options',
  Sku = 'sku',
  Barcode = 'barcode',
  Price = 'price',
  CompareAtPrice = 'compare_at_price',
  Weight = 'weight',
  RequiresShipping = 'requires_shipping',
  Taxable = 'taxable',
  OutOfStockPolicy = 'out_of_stock_policy',
}
