import { ProductDraftField } from '../enums/product-draft-field.enum.js';
import type { MediaDraft, ProductDraft, VariantDraft } from './product-draft.js';

/** Product properties a patch can set. The handle identifies the product; variants and media are merged. */
type PatchableProductKey = Exclude<keyof ProductDraft, 'handle' | 'variants' | 'media'>;
/** Variant properties a patch can set. The id and the stock belong to the catalog. */
type PatchableVariantKey = Exclude<keyof VariantDraft, 'id' | 'inventory'>;

/** The product property each field sets. */
const PRODUCT_FIELD_KEYS: ReadonlyArray<readonly [ProductDraftField, PatchableProductKey]> = [
  [ProductDraftField.Title, 'title'],
  [ProductDraftField.Description, 'descriptionHtml'],
  [ProductDraftField.Vendor, 'vendor'],
  [ProductDraftField.ProductType, 'productType'],
  [ProductDraftField.Tags, 'tags'],
  [ProductDraftField.Status, 'status'],
  [ProductDraftField.Options, 'optionNames'],
];

/** The variant property each field sets. */
const VARIANT_FIELD_KEYS: ReadonlyArray<readonly [ProductDraftField, PatchableVariantKey]> = [
  [ProductDraftField.Sku, 'sku'],
  [ProductDraftField.Barcode, 'barcode'],
  [ProductDraftField.Options, 'optionValues'],
  [ProductDraftField.Price, 'price'],
  [ProductDraftField.CompareAtPrice, 'compareAtPrice'],
  [ProductDraftField.Weight, 'weightGrams'],
  [ProductDraftField.RequiresShipping, 'requiresShipping'],
  [ProductDraftField.Taxable, 'taxable'],
  [ProductDraftField.OutOfStockPolicy, 'outOfStockPolicy'],
];

function copyFields<TRecord, TKey extends keyof TRecord>(
  target: TRecord,
  source: TRecord,
  keys: ReadonlyArray<readonly [ProductDraftField, TKey]>,
  fields: ReadonlySet<ProductDraftField>,
): TRecord {
  const patched = { ...target };
  for (const [field, key] of keys) {
    if (fields.has(field)) patched[key] = source[key];
  }
  return patched;
}

/**
 * One variant row of an update file. Only the fields the file has columns for are applied;
 * an empty cell in such a column clears the field.
 */
export class VariantPatch {
  constructor(
    /** The row as read; fields the file lacks hold placeholders. */
    readonly values: VariantDraft,
    private readonly fields: ReadonlySet<ProductDraftField>,
  ) {}

  /** The variant with the file's values for its columns. Its id and stock are kept. */
  applyTo(variant: VariantDraft): VariantDraft {
    return copyFields(variant, this.values, VARIANT_FIELD_KEYS, this.fields);
  }
}

/**
 * One product of an update file: the values it read and the fields it has columns for. A
 * field the file lacks keeps the catalog's value; a column with an empty cell clears it.
 */
export class ProductPatch {
  readonly variants: VariantPatch[];

  constructor(
    /** The product as read; fields the file lacks hold placeholders. */
    private readonly values: ProductDraft,
    private readonly fields: ReadonlySet<ProductDraftField>,
  ) {
    this.variants = values.variants.map((variant) => new VariantPatch(variant, fields));
  }

  get handle(): string {
    return this.values.handle;
  }

  get media(): MediaDraft[] {
    return this.values.media;
  }

  has(field: ProductDraftField): boolean {
    return this.fields.has(field);
  }

  /** The product's own fields with the file's values. Variants and media are left as they are. */
  applyTo(product: ProductDraft): ProductDraft {
    return copyFields(product, this.values, PRODUCT_FIELD_KEYS, this.fields);
  }
}
