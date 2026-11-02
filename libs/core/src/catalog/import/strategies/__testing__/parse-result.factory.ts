import type { CatalogParseResult, ImportIssue } from '../../../entities/catalog-import.js';
import type { ProductDraft } from '../../../entities/product-draft.js';
import { ProductDraftField } from '../../../enums/product-draft-field.enum.js';
import { FIRST_DATA_ROW } from '../../csv/csv-records.js';

/** What a parser returns for these drafts: one row per product, from the first data row, every column. */
export function parseResult(
  products: ProductDraft[],
  issues: ImportIssue[] = [],
  fields: ReadonlySet<ProductDraftField> = new Set(Object.values(ProductDraftField)),
): CatalogParseResult {
  const rowByHandle = new Map(
    products.map((draft, index) => [draft.handle, index + FIRST_DATA_ROW]),
  );
  return {
    products,
    issues,
    rowByHandle,
    variantRowsByHandle: new Map(
      products.map((draft) => [
        draft.handle,
        draft.variants.map(() => rowByHandle.get(draft.handle) ?? FIRST_DATA_ROW),
      ]),
    ),
    fields,
  };
}
