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
export const CONNECTION_ID_PARAM = 'connectionId';
export const PRODUCT_ID_PARAM = 'productId';

/** Signed decimal with at most two fraction digits: "15", "-2.50". */
export const SIGNED_DECIMAL_PATTERN = /^-?\d{1,10}(\.\d{1,2})?$/;
export const OVERRIDE_TEXT_MAX_LENGTH = 255;
export const OVERRIDE_DESCRIPTION_MAX_LENGTH = 65_535;
export const OVERRIDE_MAX_ITEMS = 250;
export const MAX_SHOWN_QUANTITY = 1_000_000;

/** Schema names the generated web client uses for these enums. */
export const PRICE_ROUNDING_SCHEMA_NAME = 'PriceRounding';
export const COMPARE_AT_MODE_SCHEMA_NAME = 'CompareAtMode';
export const PRICE_SOURCE_SCHEMA_NAME = 'PriceSource';
export const PRICE_STEP_KIND_SCHEMA_NAME = 'PriceStepKind';
export const PRICE_WARNING_SCHEMA_NAME = 'PriceWarning';
export const LISTING_STATUS_SCHEMA_NAME = 'ListingStatus';
export const CHANNEL_PRODUCT_STATE_SCHEMA_NAME = 'ChannelProductState';
export const CHANNEL_PRODUCT_SORT_SCHEMA_NAME = 'ChannelProductSort';
export const LISTING_VISIBILITY_SCHEMA_NAME = 'ListingVisibility';
