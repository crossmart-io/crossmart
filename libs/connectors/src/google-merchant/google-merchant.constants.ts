export const GOOGLE_MERCHANT_DISPLAY_NAME = 'Google Merchant Center';

/** The one scope the Merchant API needs: manage the account's products and settings. */
export enum GoogleScope {
  Content = 'https://www.googleapis.com/auth/content',
}

export const GOOGLE_REQUIRED_SCOPES: readonly GoogleScope[] = [GoogleScope.Content];

/** Google's OAuth 2.0 endpoints for web server apps. */
export const GOOGLE_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

/** Google's own consent URL parameters; the standard ones are `OAuthParam`. */
export enum GoogleOAuthParam {
  AccessType = 'access_type',
  Prompt = 'prompt',
  IncludeGrantedScopes = 'include_granted_scopes',
}

/** A refresh token is issued only for offline access. */
export const GOOGLE_OFFLINE_ACCESS = 'offline';
/** Asks for consent every time, so Google issues a refresh token on every connect. */
export const GOOGLE_CONSENT_PROMPT = 'consent';
export const GOOGLE_INCLUDE_GRANTED_SCOPES = 'true';

/** A Merchant Center account id: digits only. */
export const MERCHANT_ACCOUNT_ID_PATTERN = /^\d{1,20}$/;

/** Where a product's handle goes in the merchant's product page address. */
export const PRODUCT_URL_HANDLE_PLACEHOLDER = '{handle}';

/** The Merchant API's host; each sub-API sits under `/{subapi}/v1`. */
export const MERCHANT_API_URL = 'https://merchantapi.googleapis.com';
export const ACCOUNTS_API_PATH = '/accounts/v1/accounts/';
export const DATA_SOURCES_API_PATH = '/datasources/v1/accounts/';
export const PRODUCTS_API_PATH = '/products/v1/accounts/';
export const HOMEPAGE_SUFFIX = '/homepage';
export const BUSINESS_INFO_SUFFIX = '/businessInfo';
export const DATA_SOURCES_SUFFIX = '/dataSources';
export const PRODUCT_INPUTS_SUFFIX = '/productInputs';
export const PRODUCT_INPUTS_INSERT_SUFFIX = '/productInputs:insert';
export const DATA_SOURCE_PARAM = 'dataSource';
export const UPDATE_MASK_PARAM = 'updateMask';
/** A data source's resource name: `accounts/{account}/dataSources/{dataSource}`. */
export const ACCOUNTS_RESOURCE_PREFIX = 'accounts/';
export const DATA_SOURCES_RESOURCE_SEGMENT = '/dataSources/';
/** Joins content language, feed label and offer id in a product input's name. */
export const PRODUCT_NAME_SEPARATOR = '~';

/** The data source Crossmart creates, as the merchant sees it in Merchant Center. */
export const DATA_SOURCE_DISPLAY_NAME_PREFIX = 'Crossmart';

/** Patches only these attributes on a price update. */
export const PRICE_UPDATE_MASK = 'productAttributes.price,productAttributes.salePrice';

/**
 * Google's product limits (Merchant Center product data specification): longer values are
 * cut, never rejected.
 */
export const GOOGLE_TITLE_MAX_LENGTH = 150;
export const GOOGLE_DESCRIPTION_MAX_LENGTH = 5_000;
export const GOOGLE_ADDITIONAL_IMAGES_MAX = 10;
export const GOOGLE_OFFER_ID_MAX_LENGTH = 50;
export const GOOGLE_BRAND_MAX_LENGTH = 70;
export const GOOGLE_OPTION_VALUE_MAX_LENGTH = 100;
/** GTINs are 8, 12, 13 or 14 digits. */
export const GTIN_PATTERN = /^(\d{8}|\d{12,14})$/;
export const MICROS_PER_UNIT = 1_000_000;
export const WEIGHT_UNIT_GRAMS = 'g';
/** Option names whose values Google reads as colour and size. */
export const COLOR_OPTION_NAMES: readonly string[] = ['color', 'colour'];
export const SIZE_OPTION_NAMES: readonly string[] = ['size'];

/** At most this many product inputs are written at once for one listing. */
export const PRODUCT_WRITE_CONCURRENCY = 5;

/** API calls per connection: Google publishes no fixed rate, so this stays conservative. */
export const MERCHANT_API_BUCKET_NAME = 'google-merchant-api';
export const MERCHANT_API_BUCKET_CAPACITY = 20;
export const MERCHANT_API_RESTORE_PER_SECOND = 5;

/** Reasons in an error's `details[].metadata.REASON` that Crossmart acts on. */
export enum GoogleErrorReason {
  PermissionDeniedAccounts = 'PERMISSION_DENIED_ACCOUNTS',
  GcpNotRegistered = 'AUTH_GCP_NOT_REGISTERED',
}
/** Words in the message of an unregistered project's 401, when it carries no reason. */
export const NOT_REGISTERED_MESSAGE_FRAGMENT = 'is not registered';
/** Offer ids Crossmart uses as they are; others are derived from the variant id. */
export const GOOGLE_OFFER_ID_PATTERN = /^[A-Za-z0-9_.-]{1,50}$/;

export const BEARER_AUTH_SCHEME = 'Bearer';
