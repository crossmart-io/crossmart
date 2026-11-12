export const FALABELLA_DISPLAY_NAME = 'Falabella';

/**
 * The Seller Center API. One production host serves every country; the country is chosen by
 * the operator code in each product and the business unit code in the User-Agent. Falabella
 * documents no staging host for sellers.
 */
export const FALABELLA_API_URL = 'https://sellercenter-api.falabella.com/';

/** The `Version` parameter. The docs say it must be 1.0, whatever the API's own version. */
export const FALABELLA_API_VERSION = '1.0';

/** Every request carries these query parameters; all of them are signed. */
export enum FalabellaParam {
  Action = 'Action',
  Format = 'Format',
  Timestamp = 'Timestamp',
  UserId = 'UserID',
  Version = 'Version',
  Signature = 'Signature',
  FeedId = 'FeedID',
  PrimaryCategory = 'PrimaryCategory',
  Name = 'Name',
  Filter = 'Filter',
  SkuSellerList = 'SkuSellerList',
  Limit = 'Limit',
  Offset = 'Offset',
  UpdatedAfter = 'UpdatedAfter',
  SortBy = 'SortBy',
  SortDirection = 'SortDirection',
  ShippingType = 'ShippingType',
  OrderId = 'OrderId',
  OrderIdList = 'OrderIdList',
}

/** Responses are read as XML, the format of every example in Falabella's docs. */
export const FALABELLA_RESPONSE_FORMAT = 'XML';
export const FALABELLA_XML_CONTENT_TYPE = 'application/xml';
export const FALABELLA_XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';
export const USER_AGENT_HEADER = 'user-agent';

/** The signature: HMAC-SHA256 of the sorted, RFC 3986-encoded query, in lowercase hex. */
export const FALABELLA_SIGNATURE_ALGORITHM = 'sha256';
export const FALABELLA_SIGNATURE_ENCODING = 'hex';
export const QUERY_PAIR_SEPARATOR = '&';
export const QUERY_VALUE_SEPARATOR = '=';
/** Characters `encodeURIComponent` leaves alone that RFC 3986 reserves. */
export const RFC3986_EXTRA_RESERVED = /[!'()*]/g;
export const PERCENT_ENCODING_RADIX = 16;
/** `2015-07-01T11:11:11+00:00`, the timestamp format of the signing docs' example. */
export const ISO_SECONDS_LENGTH = 19;
export const UTC_OFFSET_SUFFIX = '+00:00';

/**
 * `SELLER_ID/TECHNOLOGY/VERSION/INTEGRATION_TYPE/BUSINESS_UNIT_CODE`. Crossmart integrates for
 * many sellers, so the integration type is its own name, as the docs ask integrators to do.
 */
export const USER_AGENT_SEPARATOR = '/';
export const USER_AGENT_TECHNOLOGY = 'Node';
export const USER_AGENT_INTEGRATION = 'CROSSMART';

/** Lists in `GetProducts` and `GetMultipleOrderItems` parameters are JSON arrays. */
export const LIST_PARAM_SEPARATOR = ',';

/** Seller ids are short codes such as `SC478FA`. */
export const SELLER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
export const USER_ID_MAX_LENGTH = 254;
export const SELLER_ID_MAX_LENGTH = 64;
export const API_KEY_MAX_LENGTH = 256;
export const COUNTRY_MAX_LENGTH = 8;
/** Joins the seller id and the country in a connection's `externalAccountId`: `SC478FA:facl`. */
export const ACCOUNT_ID_SEPARATOR = ':';

/** The global error codes the connector acts on (`ErrorCode`, also `E0xx` in the message). */
export const FALABELLA_LOGIN_FAILED_CODE = 7;
export const FALABELLA_ACCESS_DENIED_CODE = 9;
export const FALABELLA_TOO_MANY_REQUESTS_CODE = 429;
/** `E012: Invalid Feed ID`, after a feed is deleted (30 days) or never existed. */
export const FALABELLA_INVALID_FEED_CODE = 12;
/** `E039: No orders were found`. */
export const FALABELLA_NO_ORDERS_CODE = 39;
/** Falabella explains a refusal in up to 50 details; the first few are shown. */
export const FALABELLA_ERROR_DETAILS_SHOWN = 3;
export const ERROR_DETAIL_SEPARATOR = '; ';

/**
 * Feeds: ProductCreate, ProductUpdate, ProductRemove, Image and UpdateStock are queued and run
 * asynchronously. A seller may create 50 feeds freely, then one every two minutes. The bucket
 * counts a feed as 10 units, the cost core gives a sync job that makes one channel call.
 */
export const FALABELLA_FEED_BUCKET_NAME = 'seller-center-feeds';
export const FALABELLA_FEED_COST_UNITS = 10;
export const FALABELLA_FREE_FEEDS = 50;
export const FALABELLA_FEED_INTERVAL_SECONDS = 120;
export const FALABELLA_FEED_BUCKET_CAPACITY = FALABELLA_FREE_FEEDS * FALABELLA_FEED_COST_UNITS;
export const FALABELLA_FEED_RESTORE_PER_SECOND =
  FALABELLA_FEED_COST_UNITS / FALABELLA_FEED_INTERVAL_SECONDS;
/**
 * How long a write waits for its feed: Falabella reports a feed's rows only once it ran. A feed
 * still queued after this is taken as accepted; its result shows on the next sync.
 */
export const FALABELLA_FEED_POLL_INTERVAL_MS = 5_000;
export const FALABELLA_FEED_POLL_ATTEMPTS = 12;
/** Records per feed: Falabella suggests 500 and accepts up to 1,000. */
export const FALABELLA_FEED_BATCH_SIZE = 500;

/** Products read per `GetProducts` call when looking SKUs up. */
export const FALABELLA_SKU_LOOKUP_BATCH_SIZE = 100;
/** Orders read per page; `GetOrders` returns at most 100 in API version 1.0. */
export const FALABELLA_ORDERS_PAGE_SIZE = 50;

/** Products go only in leaf categories. Category suggestions shown at most. */
export const FALABELLA_CATEGORY_SUGGESTIONS = 10;
export const CATEGORY_PATH_SEPARATOR = ' > ';
/** Words shorter than this do not count when matching a title to categories. */
export const CATEGORY_MATCH_MIN_WORD_LENGTH = 3;
export const WORD_SPLIT_PATTERN = /[^\p{L}\p{N}]+/u;

/** At most 8 images per product; the first is the main one. Each call replaces them all. */
export const FALABELLA_MAX_IMAGES = 8;
export const HTTPS_PROTOCOL = 'https:';

/** The brand to list under when the product has none; Falabella's docs name it. */
export const FALABELLA_GENERIC_BRAND = 'Genérico';
/** Seller SKUs Crossmart sends: letters, digits, `-`, `_` and `.`, at most 50. */
export const FALABELLA_SKU_PATTERN = /^[A-Za-z0-9._-]{1,50}$/;
export const FALABELLA_SKU_MAX_LENGTH = 50;
export const FALABELLA_DERIVED_SKU_PREFIX = 'CM';
export const UUID_SEPARATOR_PATTERN = /-/g;
/** Joins a variant's option values in `Variation`, such as `Red / M`. */
export const VARIATION_SEPARATOR = ' / ';

/** Prices go with two decimals and a dot (`1600.00`); package sizes in whole centimetres. */
export const PRICE_FRACTION_DIGITS = 2;
export const GRAMS_PER_KILOGRAM = 1000;
export const WEIGHT_FRACTION_DIGITS = 3;

/** Seller Center timestamps (`2025-04-03 12:00:00`) carry no zone: the country's time. */
export const SELLER_CENTER_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

/** Where the merchant finds their user id and API key: Seller Center, Mi cuenta, Usuarios. */
export const FALABELLA_CREDENTIALS_GUIDE_URL =
  'https://developers.falabella.com/docs/operate-with-apis';

/** How `GetCategoryAttributes` flags attributes. */
export const ATTRIBUTE_MANDATORY = '1';
export const ATTRIBUTE_NOT_GLOBAL = '0';
/** The group of the attributes that tell a product's variations apart. */
export const VARIATION_ATTRIBUTE_GROUP = 'Variation';
/** Units listed for a variant whose stock Crossmart does not track. */
export const FALABELLA_UNTRACKED_QUANTITY = 1;
