/**
 * Etsy Open API v3 (https://developers.etsy.com/documentation). Paths and limits are from
 * Etsy's OpenAPI spec (`https://www.etsy.com/openapi/generated/oas/3.0.0.json`) and guides,
 * except where a comment says otherwise.
 */
export const ETSY_DISPLAY_NAME = 'Etsy';

/** OAuth 2.0 with PKCE (Etsy's Authentication guide). */
export const ETSY_AUTHORIZE_URL = 'https://www.etsy.com/oauth/connect';
export const ETSY_API_BASE_URL = 'https://api.etsy.com';
export const ETSY_TOKEN_PATH = '/v3/public/oauth/token';
/** Refresh tokens live 90 days; Etsy's token response does not say so. */
export const ETSY_REFRESH_TOKEN_LIFETIME_SECONDS = 90 * 24 * 60 * 60;

/** Every Etsy call carries `x-api-key: {keystring}:{shared secret}` (Request Standards). */
export const ETSY_API_KEY_HEADER = 'x-api-key';
export const ETSY_API_KEY_SEPARATOR = ':';

/** Etsy scopes are space-delimited: read and write listings, read the shop and its sales. */
export const ETSY_REQUIRED_SCOPES: readonly string[] = [
  'listings_r',
  'listings_w',
  'shops_r',
  'transactions_r',
];

/** Path parameters, replaced in the paths below. */
export enum EtsyPathParam {
  ShopId = '{shop_id}',
  ListingId = '{listing_id}',
  ListingImageId = '{listing_image_id}',
  ReceiptId = '{receipt_id}',
}

export const ETSY_ME_PATH = '/v3/application/users/me';
export const ETSY_SHOP_PATH = '/v3/application/shops/{shop_id}';
export const ETSY_SHIPPING_PROFILES_PATH = '/v3/application/shops/{shop_id}/shipping-profiles';
export const ETSY_PROCESSING_PROFILES_PATH =
  '/v3/application/shops/{shop_id}/readiness-state-definitions';
export const ETSY_SHOP_LISTINGS_PATH = '/v3/application/shops/{shop_id}/listings';
export const ETSY_SHOP_LISTING_PATH = '/v3/application/shops/{shop_id}/listings/{listing_id}';
export const ETSY_LISTING_PATH = '/v3/application/listings/{listing_id}';
export const ETSY_LISTING_INVENTORY_PATH = '/v3/application/listings/{listing_id}/inventory';
export const ETSY_LISTING_IMAGES_PATH = '/v3/application/listings/{listing_id}/images';
export const ETSY_SHOP_LISTING_IMAGES_PATH =
  '/v3/application/shops/{shop_id}/listings/{listing_id}/images';
export const ETSY_SHOP_LISTING_IMAGE_PATH =
  '/v3/application/shops/{shop_id}/listings/{listing_id}/images/{listing_image_id}';
export const ETSY_RECEIPTS_PATH = '/v3/application/shops/{shop_id}/receipts';
export const ETSY_RECEIPT_PATH = '/v3/application/shops/{shop_id}/receipts/{receipt_id}';
export const ETSY_SELLER_TAXONOMY_PATH = '/v3/application/seller-taxonomy/nodes';

/** Query parameters. */
export enum EtsyQueryParam {
  Limit = 'limit',
  Offset = 'offset',
  MinLastModified = 'min_last_modified',
  SortOn = 'sort_on',
  SortOrder = 'sort_order',
  MaxVariationsSupported = 'max_variations_supported',
}

export const ETSY_SORT_ON_UPDATED = 'updated';
export const ETSY_SORT_ASCENDING = 'asc';
/** The largest page `getShopReceipts` and the shop profile lists return. */
export const ETSY_PAGE_SIZE_MAX = 100;

/** Listing content limits: Etsy's Help Center ("How to Create a Listing", "How to Use Tags"). */
export const ETSY_TITLE_MAX_LENGTH = 140;
export const ETSY_TAG_MAX_COUNT = 13;
export const ETSY_TAG_MAX_LENGTH = 20;
/** Etsy states no description limit; Crossmart writes descriptions up to this. */
export const ETSY_DESCRIPTION_TARGET_LENGTH = 5_000;
/** "Up to 20 photos" (Help Center), and `image_ids` takes up to 20 (OpenAPI spec). */
export const ETSY_IMAGE_MAX_COUNT = 20;
/** `alt_text` of a listing image: "Max length 500 characters" (OpenAPI spec). */
export const ETSY_IMAGE_ALT_TEXT_MAX_LENGTH = 500;

/**
 * Characters Etsy refuses, as its spec states the regexes: titles take letters, numbers,
 * punctuation, math symbols, spaces, ™ © ®; tags letters, numbers, spaces, - ' ™ © ®;
 * materials letters, numbers and spaces.
 */
export const ETSY_TITLE_DISALLOWED = /[^\p{L}\p{Nd}\p{P}\p{Sm}\p{Zs}™©®]/gu;
export const ETSY_TAG_DISALLOWED = /[^\p{L}\p{Nd}\p{Zs}\-'™©®]/gu;
export const ETSY_MATERIAL_DISALLOWED = /[^\p{L}\p{Nd}\p{Zs}]/gu;
/** A title may use each of these once. */
export const ETSY_TITLE_SINGLE_USE_CHARACTERS: readonly string[] = ['%', ':', '&', '+'];
/** Tags cannot start with these (Help Center). */
export const ETSY_TAG_LEADING_DISALLOWED = /^[-']+/u;
/** Inventory property values cannot hold parentheses (OpenAPI spec). */
export const ETSY_PROPERTY_VALUE_DISALLOWED = /[()]/g;
export const WHITESPACE_RUN = /\s+/gu;
export const SINGLE_SPACE = ' ';
/** Etsy reads `tags`, `materials` and `image_ids` form fields as comma-separated lists. */
export const ETSY_LIST_SEPARATOR = ',';

/**
 * SKUs: Etsy's spec gives no limit. 32 characters is what Etsy enforces in practice
 * (unverified: observed by developers, not documented). Derived keys are `CM` and the first
 * 30 hex digits of the variant id.
 */
export const ETSY_SKU_MAX_LENGTH = 32;
export const ETSY_SKU_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;
export const ETSY_DERIVED_KEY_PREFIX = 'CM';
export const UUID_SEPARATOR_PATTERN = /-/g;

/**
 * Custom variation properties: "The property_ids for custom variations are 513, 514, and 516"
 * (Listings Tutorial). A third one needs `max_variations_supported=3` (Third Variation Tutorial).
 */
export const ETSY_CUSTOM_PROPERTY_IDS: readonly number[] = [513, 514, 516];
export const ETSY_TWO_VARIATIONS = 2;
export const ETSY_THREE_VARIATIONS = '3';

/** Untracked variants list this many units, as on eBay. */
export const ETSY_UNTRACKED_QUANTITY = 1;
/** `createDraftListing` needs a positive quantity; the inventory then sets each variant's. */
export const ETSY_MIN_DRAFT_QUANTITY = 1;

/** `{listingId}:{sku}`: stock is set on a listing's inventory, found by the variant's SKU. */
export const ETSY_INVENTORY_ID_SEPARATOR = ':';

/** Etsy shop names: 4 to 20 letters or digits (Help Center, "How to Open an Etsy Shop"). */
export const ETSY_SHOP_NAME_PATTERN = /^[A-Za-z0-9]{4,20}$/;

/** Etsy meters calls per app (QPS and QPD); this conservative default fits a new app's quota. */
export const ETSY_API_BUCKET_NAME = 'etsy-api';
export const ETSY_API_BUCKET_CAPACITY = 5;
export const ETSY_API_RESTORE_PER_SECOND = 5;
/** Largest stock batch one `setQuantities` call takes; each listing costs two calls. */
export const ETSY_STOCK_BATCH_SIZE = 50;

/** The seller taxonomy changes rarely; each process keeps it this long. */
export const ETSY_TAXONOMY_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
export const ETSY_CATEGORY_SUGGESTIONS_MAX = 10;
export const ETSY_CATEGORY_PATH_SEPARATOR = ' > ';
/** Query words shorter than this ("a", "of") do not count when matching categories. */
export const ETSY_QUERY_WORD_MIN_LENGTH = 3;
/** A word found in the leaf category's own name counts this many times one in its ancestors. */
export const ETSY_LEAF_NAME_WEIGHT = 3;
export const QUERY_WORD_SPLITTER = /[^\p{L}\p{Nd}]+/u;

/** Etsy's `{ "error": "..." }` messages are cut to this length before they reach merchants. */
export const ETSY_MESSAGE_MAX_LENGTH = 300;
export const ETSY_LISTING_URL_PREFIX = 'https://www.etsy.com/listing/';
