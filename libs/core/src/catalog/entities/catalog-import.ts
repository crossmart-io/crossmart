import type { CatalogImportFormat } from '../enums/catalog-import-format.enum.js';
import type { ImportIssueCode } from '../enums/import-issue-code.enum.js';
import type { ProductDraft } from './product-draft.js';

/** A problem with one product in an import file. */
export interface ImportIssue {
  code: ImportIssueCode;
  message: string;
  handle?: string;
  /** Spreadsheet row number, counting the header as row 1. */
  row?: number;
}

export interface CatalogParseResult {
  products: ProductDraft[];
  issues: ImportIssue[];
}

/** Turns an uploaded file into product drafts. One implementation per `CatalogImportFormat`. */
export interface CatalogFileParser {
  readonly format: CatalogImportFormat;
  parse(content: Buffer): CatalogParseResult;
}

export interface CatalogImportResult {
  createdProducts: number;
  createdVariants: number;
  /** Products already in the catalog. They are never overwritten by an import. */
  skipped: ImportIssue[];
  /** Products that could not be imported, with the reason. */
  failed: ImportIssue[];
}
