export const LISTINGS_TAG = 'Listings';
export const CONNECTION_ROUTE = 'workspaces/:workspaceId/channel-connections/:connectionId';
export const PRODUCT_CHANNELS_ROUTE = 'workspaces/:workspaceId/products/:productId/channels';
export const PRICING_PATH = 'pricing';
export const PRICING_PREVIEW_PATH = 'pricing/preview';
export const SELECTION_PATH = 'product-selection';
export const SELECTION_PREVIEW_PATH = 'product-selection/preview';
export const SYNC_PATH = 'sync';
export const LISTINGS_PATH = 'listings';
export const CHANNEL_PRODUCTS_PATH = 'products';
export const OVERRIDE_PATH = ':connectionId/override';
export const PRODUCT_CHANNEL_PATH = ':connectionId';
export const RETRY_PATH = ':connectionId/retry';
export const LISTING_EDITOR_PATH = ':connectionId/listing';
export const ADD_PRODUCTS_PATH = 'products/add';
export const REMOVE_PRODUCTS_PATH = 'products/remove';
export const CONNECTION_ID_PARAM = 'connectionId';
export const PRODUCT_ID_PARAM = 'productId';

/** Signed decimal with at most two fraction digits: "15", "-2.50". */
export const SIGNED_DECIMAL_PATTERN = /^-?\d{1,10}(\.\d{1,2})?$/;
export const OVERRIDE_TEXT_MAX_LENGTH = 255;
export const OVERRIDE_DESCRIPTION_MAX_LENGTH = 65_535;
export const OVERRIDE_MAX_ITEMS = 250;
/** How the API documents a variant's rule price, wherever it shows one. */
export const RULE_PRICE_DESCRIPTION =
  'In the store’s currency: what its pricing rule gives, before a fixed price on the listing. ' +
  'Equal to the effective price unless the price is overridden.';
export const MAX_SHOWN_QUANTITY = 1_000_000;

/** Schema names the generated web client uses for these enums. */
export const PRICE_ROUNDING_SCHEMA_NAME = 'PriceRounding';
export const COMPARE_AT_MODE_SCHEMA_NAME = 'CompareAtMode';
export const PRICE_SOURCE_SCHEMA_NAME = 'PriceSource';
export const PRICE_STEP_KIND_SCHEMA_NAME = 'PriceStepKind';
export const PRICE_WARNING_SCHEMA_NAME = 'PriceWarning';
export const LISTING_STATUS_SCHEMA_NAME = 'ListingStatus';
export const LISTING_SOURCE_SCHEMA_NAME = 'ListingSource';
export const CHANNEL_PRODUCT_STATE_SCHEMA_NAME = 'ChannelProductState';
export const LISTING_DISPLAY_STATE_SCHEMA_NAME = 'ListingDisplayState';
export const CHANNEL_PRODUCT_SORT_SCHEMA_NAME = 'ChannelProductSort';
export const CHANNEL_PRODUCT_VIEW_SCHEMA_NAME = 'ChannelProductView';
export const LISTING_VISIBILITY_SCHEMA_NAME = 'ListingVisibility';
export const LISTING_RETRY_ERROR_CODE_SCHEMA_NAME = 'ListingRetryErrorCode';

export const CATEGORY_PATH = ':connectionId/category';
export const CATEGORY_SUGGESTIONS_PATH = ':connectionId/category-suggestions';
export const ITEM_SPECIFICS_PATH = ':connectionId/item-specifics';
export const CATEGORY_ASPECT_USAGE_SCHEMA_NAME = 'CategoryAspectUsage';
export const CATEGORY_ASPECT_MODE_SCHEMA_NAME = 'CategoryAspectMode';
export const CATEGORY_ID_MAX_LENGTH = 64;
export const CATEGORY_NAME_MAX_LENGTH = 500;
export const CATEGORY_QUERY_MAX_LENGTH = 255;
