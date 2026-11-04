export const CATALOG_TAG = 'Catalog';
export const PRODUCTS_ROUTE = 'workspaces/:workspaceId/products';
export const PRODUCT_IMPORTS_ROUTE = 'workspaces/:workspaceId/product-imports';
export const PRODUCT_ID_PARAM = 'productId';
/** Multipart field that carries an uploaded file (catalog import or image). */
export const UPLOAD_FILE_FIELD = 'file';

export const PRODUCT_TITLE_MAX_LENGTH = 255;
export const PRODUCT_HANDLE_MAX_LENGTH = 255;
export const PRODUCT_TEXT_MAX_LENGTH = 255;
export const PRODUCT_DESCRIPTION_MAX_LENGTH = 65_535;
export const PRODUCT_TAGS_MAX = 250;
export const PRODUCT_MEDIA_MAX = 250;
export const PRODUCT_SEARCH_MAX_LENGTH = 200;

/** Schema names the generated web client uses for the catalog enums. */
export const CATALOG_GAP_SCHEMA_NAME = 'CatalogGap';
export const PRODUCT_STATUS_SCHEMA_NAME = 'ProductStatus';
export const OUT_OF_STOCK_POLICY_SCHEMA_NAME = 'OutOfStockPolicy';
export const CATALOG_IMPORT_FORMAT_SCHEMA_NAME = 'CatalogImportFormat';
export const IMPORT_ISSUE_CODE_SCHEMA_NAME = 'ImportIssueCode';
export const CATALOG_STATS_ROUTE = 'workspaces/:workspaceId/catalog-stats';
export const PRODUCT_IMAGES_ROUTE = 'workspaces/:workspaceId/media/product-images';
export const IMAGE_CONTENT_TYPE_SCHEMA_NAME = 'ImageContentType';
