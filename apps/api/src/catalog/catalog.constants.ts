import { CatalogImportMode, WorkspacePermission } from '@crossmart/core';

export const CATALOG_TAG = 'Catalog';
export const PRODUCTS_ROUTE = 'workspaces/:workspaceId/products';
export const PRODUCT_IMPORTS_ROUTE = 'workspaces/:workspaceId/product-imports';
export const PRODUCT_BULK_ACTIONS_ROUTE = 'workspaces/:workspaceId/product-bulk-actions';
export const PRODUCT_VIEWS_ROUTE = 'workspaces/:workspaceId/product-views';
export const PRODUCT_ID_PARAM = 'productId';
export const VIEW_ID_PARAM = 'viewId';
/** One variant of a product; named `variantId` in `VariantParamsDto`. */
export const VARIANT_PATH = `:${PRODUCT_ID_PARAM}/variants/:variantId`;
/** Marks one product sold: its stock goes to 0 and it leaves every store. */
export const MARK_SOLD_PATH = `:${PRODUCT_ID_PARAM}/mark-sold`;
/** Multipart field that carries an uploaded file (catalog import or image). */
export const UPLOAD_FILE_FIELD = 'file';
/** Browsers send file names as UTF-8; multer would otherwise read them as Latin-1. */
export const UPLOAD_FILE_NAME_CHARSET = 'utf8';

/** Shopify takes product titles of up to 255 characters, the most of any channel. */
export const PRODUCT_TITLE_MAX_LENGTH = 255;
export const PRODUCT_HANDLE_MAX_LENGTH = 255;
export const PRODUCT_TEXT_MAX_LENGTH = 255;
export const PRODUCT_DESCRIPTION_MAX_LENGTH = 65_535;
export const PRODUCT_TAGS_MAX = 250;
export const PRODUCT_MEDIA_MAX = 250;
export const PRODUCT_SEARCH_MAX_LENGTH = 200;

/** Schema names the generated web client uses for the catalog enums. */
export const CATALOG_GAP_SCHEMA_NAME = 'CatalogGap';
export const BULK_PRODUCT_ACTION_SCHEMA_NAME = 'BulkProductAction';
export const PRODUCT_STATUS_SCHEMA_NAME = 'ProductStatus';
export const OUT_OF_STOCK_POLICY_SCHEMA_NAME = 'OutOfStockPolicy';
export const PRODUCT_CONDITION_SCHEMA_NAME = 'ProductCondition';
export const CATALOG_IMPORT_FORMAT_SCHEMA_NAME = 'CatalogImportFormat';
export const IMPORT_ISSUE_CODE_SCHEMA_NAME = 'ImportIssueCode';
export const CATALOG_IMPORT_MODE_SCHEMA_NAME = 'CatalogImportMode';
export const IMPORT_JOB_STATUS_SCHEMA_NAME = 'ImportJobStatus';
export const IMPORT_ISSUE_OUTCOME_SCHEMA_NAME = 'ImportIssueOutcome';
export const IMPORT_JOBS_ROUTE = 'workspaces/:workspaceId/import-jobs';
export const IMPORT_JOB_ID_PARAM = 'jobId';
export const CATALOG_STATS_ROUTE = 'workspaces/:workspaceId/catalog-stats';
export const PRODUCT_IMAGES_ROUTE = 'workspaces/:workspaceId/media/product-images';
export const IMAGE_CONTENT_TYPE_SCHEMA_NAME = 'ImageContentType';
export const PRODUCT_FILTER_MAX_TAGS = 50;
export const PRODUCT_STORE_FILTER_SCHEMA_NAME = 'ProductStoreFilter';
export const PRODUCT_SORT_SCHEMA_NAME = 'ProductSort';

/** What each import mode changes decides the permission it needs. */
export const IMPORT_MODE_PERMISSIONS: Readonly<Record<CatalogImportMode, WorkspacePermission>> = {
  [CatalogImportMode.Create]: WorkspacePermission.EditProducts,
  [CatalogImportMode.Update]: WorkspacePermission.EditProducts,
  [CatalogImportMode.CreateOrLink]: WorkspacePermission.EditProducts,
  [CatalogImportMode.Inventory]: WorkspacePermission.EditInventory,
};
