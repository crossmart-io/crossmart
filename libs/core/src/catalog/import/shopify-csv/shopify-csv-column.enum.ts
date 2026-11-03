import { ProductDraftField } from '../../enums/product-draft-field.enum.js';

/** Header names of Shopify's product CSV export (help.shopify.com/manual/products/import-export). */
export enum ShopifyCsvColumn {
  Handle = 'Handle',
  Title = 'Title',
  BodyHtml = 'Body (HTML)',
  Vendor = 'Vendor',
  Type = 'Type',
  Tags = 'Tags',
  Published = 'Published',
  Status = 'Status',
  Option1Name = 'Option1 Name',
  Option1Value = 'Option1 Value',
  Option2Name = 'Option2 Name',
  Option2Value = 'Option2 Value',
  Option3Name = 'Option3 Name',
  Option3Value = 'Option3 Value',
  VariantSku = 'Variant SKU',
  VariantGrams = 'Variant Grams',
  VariantInventoryTracker = 'Variant Inventory Tracker',
  VariantInventoryQty = 'Variant Inventory Qty',
  VariantInventoryPolicy = 'Variant Inventory Policy',
  VariantPrice = 'Variant Price',
  VariantCompareAtPrice = 'Variant Compare At Price',
  /** Optional: what the merchant pays per unit. */
  CostPerItem = 'Cost per item',
  VariantRequiresShipping = 'Variant Requires Shipping',
  VariantTaxable = 'Variant Taxable',
  VariantBarcode = 'Variant Barcode',
  ImageSrc = 'Image Src',
  ImagePosition = 'Image Position',
  ImageAltText = 'Image Alt Text',
}

export const SHOPIFY_OPTION_COLUMNS = [
  { name: ShopifyCsvColumn.Option1Name, value: ShopifyCsvColumn.Option1Value },
  { name: ShopifyCsvColumn.Option2Name, value: ShopifyCsvColumn.Option2Value },
  { name: ShopifyCsvColumn.Option3Name, value: ShopifyCsvColumn.Option3Value },
] as const;

export const SHOPIFY_REQUIRED_COLUMNS = [ShopifyCsvColumn.Handle, ShopifyCsvColumn.Title] as const;
/** An update file only needs to say which products it changes. */
export const SHOPIFY_PARTIAL_REQUIRED_COLUMNS = [ShopifyCsvColumn.Handle] as const;

/** The columns that carry each field. A file has a field when it has any of its columns. */
export const SHOPIFY_FIELD_COLUMNS: Readonly<
  Record<ProductDraftField, readonly ShopifyCsvColumn[]>
> = {
  [ProductDraftField.Title]: [ShopifyCsvColumn.Title],
  [ProductDraftField.Description]: [ShopifyCsvColumn.BodyHtml],
  [ProductDraftField.Vendor]: [ShopifyCsvColumn.Vendor],
  [ProductDraftField.ProductType]: [ShopifyCsvColumn.Type],
  [ProductDraftField.Tags]: [ShopifyCsvColumn.Tags],
  [ProductDraftField.Status]: [ShopifyCsvColumn.Status, ShopifyCsvColumn.Published],
  [ProductDraftField.Options]: [ShopifyCsvColumn.Option1Name],
  [ProductDraftField.Sku]: [ShopifyCsvColumn.VariantSku],
  [ProductDraftField.Barcode]: [ShopifyCsvColumn.VariantBarcode],
  [ProductDraftField.Price]: [ShopifyCsvColumn.VariantPrice],
  [ProductDraftField.CompareAtPrice]: [ShopifyCsvColumn.VariantCompareAtPrice],
  [ProductDraftField.Cost]: [ShopifyCsvColumn.CostPerItem],
  [ProductDraftField.Weight]: [ShopifyCsvColumn.VariantGrams],
  [ProductDraftField.RequiresShipping]: [ShopifyCsvColumn.VariantRequiresShipping],
  [ProductDraftField.Taxable]: [ShopifyCsvColumn.VariantTaxable],
  [ProductDraftField.OutOfStockPolicy]: [ShopifyCsvColumn.VariantInventoryPolicy],
};

/** What Shopify writes for the only variant of a product without options. */
export const SHOPIFY_DEFAULT_OPTION_NAME = 'Title';
export const SHOPIFY_DEFAULT_OPTION_VALUE = 'Default Title';
export const SHOPIFY_CONTINUE_SELLING_POLICY = 'continue';
export const SHOPIFY_TAG_SEPARATOR = ',';
