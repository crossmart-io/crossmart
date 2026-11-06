/**
 * Friendly names for the request and response types of the OpenAPI spec. They are aliases of
 * `components` and `operations` in `generated/schema.ts`, so they never drift from the API.
 */
import type { components, operations } from './generated/schema.js';

type Schemas = components['schemas'];
type QueryOf<OperationId extends keyof operations> = NonNullable<
  operations[OperationId]['parameters']['query']
>;
/** A list query without its page position, for iterators that walk every page themselves. */
type ListAllQuery<Query> = Omit<Query, 'cursor' | 'page'>;

// Catalog
export type Product = Schemas['ProductDto'];
export type ProductSummary = Schemas['ProductSummaryDto'];
export type Variant = Schemas['VariantDto'];
export type CreateProductInput = Schemas['CreateProductDto'];
export type UpdateProductInput = Schemas['UpdateProductDto'];
export type ListProductsQuery = QueryOf<'ProductsController_list_v1'>;
export type ListAllProductsQuery = ListAllQuery<ListProductsQuery>;

// Inventory
export type InventoryItem = Schemas['InventoryItemDto'];
export type InventoryMovement = Schemas['InventoryMovementDto'];
export type AdjustStockInput = Schemas['AdjustStockDto'];
export type ListInventoryQuery = QueryOf<'InventoryItemsController_list_v1'>;
export type ListAllInventoryQuery = ListAllQuery<ListInventoryQuery>;
export type ListMovementsQuery = QueryOf<'InventoryItemsController_history_v1'>;
export type ListAllMovementsQuery = ListAllQuery<ListMovementsQuery>;

// Stores (channel connections)
export type Store = Schemas['ChannelConnectionDto'];
export type PricingRule = Schemas['PricingRuleDto'];
export type PricingPreviewInput = Schemas['PricingPreviewRequestDto'];
export type PricingPreview = Schemas['PricingPreviewDto'];
export type SyncRequestResult = Schemas['SyncRequestResultDto'];
export type SyncProgress = Schemas['SyncProgressDto'];

// Listings
export type ProductChannel = Schemas['ProductChannelDto'];
export type Listing = Schemas['ChannelListingDto'];
export type ListingOverrideInput = Schemas['ListingOverrideDto'];
export type ListingOverridePatch = Schemas['ListingOverridePatchDto'];
export type ListingEditor = Schemas['ListingEditorDto'];
export type StoreProductsResult = Schemas['StoreProductsResultDto'];
export type ListListingsQuery = QueryOf<'ChannelSyncController_listListings_v1'>;
export type ListAllListingsQuery = ListAllQuery<ListListingsQuery>;

// Orders
export type OrderSummary = Schemas['OrderSummaryDto'];
export type Order = Schemas['OrderDetailDto'];
export type ListOrdersQuery = QueryOf<'OrdersController_list_v1'>;
export type ListAllOrdersQuery = ListAllQuery<ListOrdersQuery>;

// Reports
export type SalesReport = Schemas['SalesReportDto'];
export type SalesReportQuery = QueryOf<'SalesReportController_get_v1'>;
export type InventoryReport = Schemas['InventoryReportDto'];
export type ListingHealthReport = Schemas['ListingHealthReportDto'];

// AI
export type AiStatus = Schemas['AiStatusDto'];
export type AiUsageReport = Schemas['AiUsageReportDto'];
export type AiUsageQuery = QueryOf<'AiController_usageReport_v1'>;
export type GenerateContentInput = Schemas['GenerateContentDto'];
export type ContentGenerationReceipt = Schemas['ContentGenerationReceiptDto'];
export type ContentDraftInput = Schemas['CreateContentDraftDto'];
export type ContentDraft = Schemas['ContentDraftDto'];

// Suggestions
export type Suggestion = Schemas['SuggestionDto'];
export type ListSuggestionsQuery = QueryOf<'SuggestionsController_list_v1'>;
export type ListAllSuggestionsQuery = ListAllQuery<ListSuggestionsQuery>;
export type BulkApproveSuggestionsInput = Schemas['BulkApproveSuggestionsDto'];
export type BulkReviewResult = Schemas['BulkReviewResultDto'];

// Workspaces
export type Workspace = Schemas['WorkspaceDto'];
export type UpdateWorkspaceInput = Schemas['UpdateWorkspaceDto'];
export type CurrentApiKey = Schemas['CurrentApiKeyDto'];

// Errors
export type PlanLimitErrorBody = Schemas['PlanLimitErrorDto'];
export type ListingRetryErrorBody = Schemas['ListingRetryErrorDto'];
