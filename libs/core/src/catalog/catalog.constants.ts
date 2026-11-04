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
