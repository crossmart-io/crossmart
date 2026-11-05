import { EbayEnvironment } from '@crossmart/common';

export const EBAY_DISPLAY_NAME = 'eBay';

/**
 * OAuth scopes Crossmart requests. All are required for now: inventory and account for
 * publishing, fulfillment for orders, and identity to name the account on connect.
 */
export enum EbayScope {
  Api = 'https://api.ebay.com/oauth/api_scope',
  SellInventory = 'https://api.ebay.com/oauth/api_scope/sell.inventory',
  SellAccount = 'https://api.ebay.com/oauth/api_scope/sell.account',
  SellFulfillment = 'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
  IdentityReadonly = 'https://api.ebay.com/oauth/api_scope/commerce.identity.readonly',
}

export const EBAY_REQUIRED_SCOPES: readonly EbayScope[] = [
  EbayScope.Api,
  EbayScope.SellInventory,
  EbayScope.SellAccount,
  EbayScope.SellFulfillment,
  EbayScope.IdentityReadonly,
];
export const EBAY_SCOPE_SEPARATOR = ' ';

/** Where each eBay environment lives: sign-in, the REST APIs, and the identity API. */
export interface EbayHosts {
  auth: string;
  api: string;
  identity: string;
}

export const EBAY_HOSTS: Readonly<Record<EbayEnvironment, EbayHosts>> = {
  [EbayEnvironment.Sandbox]: {
    auth: 'https://auth.sandbox.ebay.com',
    api: 'https://api.sandbox.ebay.com',
    identity: 'https://apiz.sandbox.ebay.com',
  },
  [EbayEnvironment.Production]: {
    auth: 'https://auth.ebay.com',
    api: 'https://api.ebay.com',
    identity: 'https://apiz.ebay.com',
  },
};

export const EBAY_AUTHORIZE_PATH = '/oauth2/authorize';
export const EBAY_TOKEN_PATH = '/identity/v1/oauth2/token';
export const EBAY_USER_PATH = '/commerce/identity/v1/user/';
export const EBAY_FULFILLMENT_POLICY_PATH = '/sell/account/v1/fulfillment_policy';
export const EBAY_PAYMENT_POLICY_PATH = '/sell/account/v1/payment_policy';
export const EBAY_RETURN_POLICY_PATH = '/sell/account/v1/return_policy';
export const EBAY_MARKETPLACE_ID_PARAM = 'marketplace_id';

/** OAuth request, callback and token parameters. */
export enum EbayOAuthParam {
  ClientId = 'client_id',
  ResponseType = 'response_type',
  RedirectUri = 'redirect_uri',
  Scope = 'scope',
  State = 'state',
  Code = 'code',
  GrantType = 'grant_type',
  RefreshToken = 'refresh_token',
}

export enum EbayGrantType {
  AuthorizationCode = 'authorization_code',
  RefreshToken = 'refresh_token',
}

export const EBAY_CODE_RESPONSE_TYPE = 'code';
/** The OAuth error eBay answers when a refresh token expired or was revoked. */
export const EBAY_INVALID_GRANT_ERROR = 'invalid_grant';

export const BASIC_AUTH_SCHEME = 'Basic';
export const BEARER_AUTH_SCHEME = 'Bearer';
export const BASIC_CREDENTIALS_SEPARATOR = ':';

/**
 * Error ids the Account API answers when the seller has not opted in to business policies
 * (20403: "User is not eligible for Business Policy"). Connecting still succeeds; the
 * settings say policies are off.
 */
export const EBAY_BUSINESS_POLICY_UNAVAILABLE_ERROR_IDS: ReadonlySet<number> = new Set([20403]);

/**
 * eBay meters Sell API calls per app per day, not per second, and publishes no per-user
 * burst limit. These are conservative defaults: a burst of 10 calls per connection, refilled
 * at 2 calls per second, well under the daily quotas of the APIs Crossmart uses.
 */
export const EBAY_API_BUCKET_NAME = 'sell-api';
export const EBAY_API_BUCKET_CAPACITY = 10;
export const EBAY_API_RESTORE_PER_SECOND = 2;

/** `externalAccountId` is `{userId}:{marketplaceId}`: one connection per account and site. */
export const EBAY_ACCOUNT_ID_SEPARATOR = ':';
/** Joins the account name and the site in the connection's display name. */
export const EBAY_DISPLAY_NAME_SEPARATOR = ' · ';

/** Sell Inventory API: inventory items, groups, offers and locations. */
export const EBAY_INVENTORY_API_PATH = '/sell/inventory/v1';
export const EBAY_INVENTORY_ITEM_PATH = `${EBAY_INVENTORY_API_PATH}/inventory_item/`;
export const EBAY_INVENTORY_ITEM_GROUP_PATH = `${EBAY_INVENTORY_API_PATH}/inventory_item_group/`;
export const EBAY_OFFER_PATH = `${EBAY_INVENTORY_API_PATH}/offer`;
export const EBAY_PUBLISH_SUFFIX = '/publish';
export const EBAY_WITHDRAW_SUFFIX = '/withdraw';
export const EBAY_PUBLISH_GROUP_PATH = `${EBAY_OFFER_PATH}/publish_by_inventory_item_group`;
export const EBAY_WITHDRAW_GROUP_PATH = `${EBAY_OFFER_PATH}/withdraw_by_inventory_item_group`;
export const EBAY_BULK_PRICE_QUANTITY_PATH = `${EBAY_INVENTORY_API_PATH}/bulk_update_price_quantity`;
export const EBAY_LOCATION_PATH = `${EBAY_INVENTORY_API_PATH}/location/`;
export const EBAY_UPDATE_LOCATION_SUFFIX = '/update_location_details';
export const EBAY_SKU_PARAM = 'sku';

/** Account API: opting in to business policies. */
export const EBAY_OPT_IN_PATH = '/sell/account/v1/program/opt_in';
export const EBAY_SELLING_POLICY_PROGRAM = 'SELLING_POLICY_MANAGEMENT';

/** Taxonomy API: the marketplace's category tree and suggestions in it. */
export const EBAY_DEFAULT_CATEGORY_TREE_PATH = '/commerce/taxonomy/v1/get_default_category_tree_id';
export const EBAY_CATEGORY_TREE_PATH = '/commerce/taxonomy/v1/category_tree/';
export const EBAY_CATEGORY_SUGGESTIONS_SUFFIX = '/get_category_suggestions';
export const EBAY_QUERY_PARAM = 'q';
/** Joins a category's ancestors and its name, as eBay's site shows the path. */
export const EBAY_CATEGORY_PATH_SEPARATOR = ' > ';

export const CONTENT_LANGUAGE_HEADER = 'content-language';
export const ACCEPT_LANGUAGE_HEADER = 'accept-language';
/**
 * Sent when a request names no listing language. Node's fetch otherwise sends
 * `Accept-Language: *`, which the Inventory API rejects (error 25709).
 */
export const EBAY_DEFAULT_LANGUAGE = 'en-US';

/** Inventory API limits, from eBay's reference. */
export const EBAY_TITLE_MAX_LENGTH = 80;
export const EBAY_DESCRIPTION_MAX_LENGTH = 500_000;
export const EBAY_MAX_IMAGES = 24;
export const EBAY_SKU_MAX_LENGTH = 50;
export const EBAY_BULK_PRICE_MAX_SKUS = 25;
/** Merchant SKUs eBay accepts as they are; others get one derived from the variant id. */
export const EBAY_SKU_PATTERN = /^[A-Za-z0-9_-]{1,50}$/;
/** Prefixes keys Crossmart derives from its own ids, so they read as Crossmart's. */
export const EBAY_DERIVED_KEY_PREFIX = 'CM';
export const UUID_SEPARATOR_PATTERN = /-/g;
export const HTTPS_PROTOCOL = 'https:';

/** Barcode lengths: a UPC-A has 12 digits, an EAN-13 has 13. */
export const UPC_LENGTH = 12;
export const EAN_LENGTH = 13;
export const DIGITS_PATTERN = /^\d+$/;

/** Stock sent for variants that do not track it; eBay needs a quantity to list. */
export const EBAY_UNTRACKED_QUANTITY = 1;

/** The aspect eBay reads the brand from. */
export const EBAY_BRAND_ASPECT = 'Brand';

/** Where items ship from: the one inventory location Crossmart creates per connection. */
export const EBAY_MERCHANT_LOCATION_KEY = 'crossmart-default';
export const EBAY_LOCATION_NAME = 'Crossmart ship-from location';

/** A listing's page on eBay; the sandbox has one site for every marketplace. */
export const EBAY_ITEM_PATH = '/itm/';
export const EBAY_SANDBOX_SITE_HOST = 'sandbox.ebay.com';

/** Phrases eBay prefixes its messages with, dropped from what merchants read. */
export const EBAY_MESSAGE_NOISE = /^A user error has occurred\.\s*/i;
/** Caps each eBay message Crossmart repeats; listing failures are capped again by core. */
export const EBAY_MESSAGE_MAX_LENGTH = 300;
/** The error eBay answers when the seller already opted in to a program. */
export const EBAY_ALREADY_OPTED_IN_ERROR_IDS: ReadonlySet<number> = new Set([20409]);
/** The error eBay answers when a location with that key exists already. */
export const EBAY_LOCATION_EXISTS_ERROR_IDS: ReadonlySet<number> = new Set([25803]);

/** Ship-from address limits: an ISO 3166 alpha-2 country, and eBay's field lengths. */
export const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;
export const POSTAL_CODE_MAX_LENGTH = 32;
export const CITY_MAX_LENGTH = 128;
export const POLICY_ID_MAX_LENGTH = 64;
/** Errors `GET /offer?sku=` answers when the SKU has no offer (or no item) yet. */
export const EBAY_NO_OFFER_ERROR_IDS: ReadonlySet<number> = new Set([25702, 25713]);

/**
 * The business policies Crossmart creates for a seller who has none ("Create default
 * policies"): free standard shipping, immediate payment, and 30-day returns the buyer ships.
 */
export const EBAY_DEFAULT_FULFILLMENT_POLICY_NAME = 'Crossmart standard shipping';
export const EBAY_DEFAULT_PAYMENT_POLICY_NAME = 'Crossmart payment';
export const EBAY_DEFAULT_RETURN_POLICY_NAME = 'Crossmart 30-day returns';
/** Business days between a cleared payment and handing the order to the carrier. */
export const EBAY_DEFAULT_HANDLING_DAYS = 3;
export const EBAY_DEFAULT_RETURN_DAYS = 30;
/** Free shipping is a flat rate of zero; eBay takes amounts as decimal strings. */
export const EBAY_FREE_SHIPPING_AMOUNT = '0.00';
/** The first (and only) domestic shipping service of the default policy. */
export const EBAY_FIRST_SORT_ORDER = 1;
/**
 * eBay answers a policy that duplicates an existing one with error 20400 ("Invalid request.
 * This policy already exists"). 20400 is also eBay's generic invalid request, so a duplicate is
 * recognised by the parameters that name the existing policy, too.
 */
export const EBAY_DUPLICATE_POLICY_ERROR_IDS: ReadonlySet<number> = new Set([20400]);
export const EBAY_DUPLICATE_POLICY_ID_PARAM = 'DuplicateProfileId';
export const EBAY_DUPLICATE_POLICY_NAME_PARAM = 'DuplicateProfileName';
