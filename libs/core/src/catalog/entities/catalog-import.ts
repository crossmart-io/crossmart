import type { Actor } from '../../activity/entities/actor.js';
import type { CatalogImportFormat } from '../enums/catalog-import-format.enum.js';
import type { CatalogImportMode } from '../enums/catalog-import-mode.enum.js';
import type { ImportIssueCode } from '../enums/import-issue-code.enum.js';
import type { ProductDraftField } from '../enums/product-draft-field.enum.js';
import type { ProductDraft } from './product-draft.js';

/** A problem with one product or row of an import file. */
export interface ImportIssue {
  code: ImportIssueCode;
  message: string;
  handle?: string;
  sku?: string;
  /** Spreadsheet row number, counting the header as row 1. */
  row?: number;
}

export interface CatalogParseOptions {
  /**
   * Reads the file as changes to existing products. A column the file lacks is neither
   * required nor defaulted, and drafts are not validated: the update mode merges them into
   * the catalog products first and validates the result.
   */
  partial?: boolean;
}

export interface CatalogParseResult {
  products: ProductDraft[];
  issues: ImportIssue[];
  /** The spreadsheet row each product starts on, by handle. */
  rowByHandle: ReadonlyMap<string, number>;
  /** The spreadsheet row of each of a product's variants, in variant order, by handle. */
  variantRowsByHandle: ReadonlyMap<string, readonly number[]>;
  /**
   * The fields the file has columns for. In a partial parse, the drafts' other fields hold
   * placeholders that must not be written.
   */
  fields: ReadonlySet<ProductDraftField>;
}

/** Turns an uploaded file into product drafts. One implementation per `CatalogImportFormat`. */
export interface CatalogFileParser {
  readonly format: CatalogImportFormat;
  parse(content: Buffer, options?: CatalogParseOptions): CatalogParseResult;
}

/** The stock one row of an inventory file asks for. */
export interface StockLevelDraft {
  sku: string;
  available: number;
  row: number;
}

export interface StockParseResult {
  levels: StockLevelDraft[];
  issues: ImportIssue[];
}

/** Turns an uploaded file into stock levels. One implementation per `CatalogImportFormat`. */
export interface StockFileParser {
  readonly format: CatalogImportFormat;
  parse(content: Buffer): StockParseResult;
}

/** What one import did to the catalog. Counts a mode does not touch stay at zero. */
export interface ImportOutcome {
  createdProducts: number;
  createdVariants: number;
  updatedProducts: number;
  /** Variants whose stock an inventory import set. */
  updatedVariants: number;
  /** Records left as they were: already in the catalog, not found, or not tracking stock. */
  skipped: ImportIssue[];
  /** Records that could not be imported, with the reason. */
  failed: ImportIssue[];
  /** Products the import created or changed, so each one's activity history shows it. */
  productIds: string[];
}

export interface CatalogImportResult extends Omit<ImportOutcome, 'productIds'> {
  /** The import history entry that records this import. */
  jobId: string;
  mode: CatalogImportMode;
}

/** One file to import, with who sent it. */
export interface CatalogImportRequest {
  mode: CatalogImportMode;
  format: CatalogImportFormat;
  fileName: string;
  content: Buffer;
  actor: Actor;
}

/** Runs the imports of one `CatalogImportMode`. */
export interface CatalogImportStrategy {
  readonly mode: CatalogImportMode;
  /** Whether this mode can read files of `format`. */
  supports(format: CatalogImportFormat): boolean;
  /** Applies the file, crediting every change to the request's actor. */
  run(workspaceId: string, request: CatalogImportRequest): Promise<ImportOutcome>;
}
