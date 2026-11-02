/** Marketplaces (Shopify, eBay) allow at most three options such as Size, Color and Material. */
export const MAX_PRODUCT_OPTIONS = 3;
export const MAX_VARIANTS_PER_PRODUCT = 250;

export const PRODUCT_PAGE_DEFAULT_LIMIT = 25;
export const PRODUCT_PAGE_MAX_LIMIT = 100;

export const IMPORT_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const IMPORT_MAX_ROWS = 10_000;
/** Products created per transaction during an import. */
export const IMPORT_PRODUCT_BATCH_SIZE = 50;

/** Injection token for every registered `CatalogFileParser`. */
export const CATALOG_FILE_PARSERS = Symbol('CATALOG_FILE_PARSERS');

/** Products one bulk action may change; the list selects at most a few pages at a time. */
export const MAX_BULK_PRODUCTS = 250;
/** A price cut of more than 90% is almost always a typo. */
export const MIN_PRICE_ADJUSTMENT_PERCENT = -90;
export const MAX_PRICE_ADJUSTMENT_PERCENT = 500;
export const MAX_BULK_TAGS = 20;

/** Saved views per workspace: enough for every team's lists, small enough to show as chips. */
export const MAX_PRODUCT_VIEWS = 50;
export const PRODUCT_VIEW_NAME_MAX_LENGTH = 60;

/** Injection token for every registered `StockFileParser`. */
export const STOCK_FILE_PARSERS = Symbol('STOCK_FILE_PARSERS');
/** Injection token for the `CatalogImportStrategy` of every `CatalogImportMode`. */
export const CATALOG_IMPORT_STRATEGIES = Symbol('CATALOG_IMPORT_STRATEGIES');
export const IMPORT_FILE_NAME_MAX_LENGTH = 255;
export const IMPORT_JOB_PAGE_DEFAULT_LIMIT = 20;
export const IMPORT_JOB_PAGE_MAX_LIMIT = 100;
/** What the history shows when a file fails for a reason that must not reach users. */
export const IMPORT_UNEXPECTED_FAILURE_MESSAGE =
  'The import failed unexpectedly. Please try again.';
