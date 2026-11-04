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
