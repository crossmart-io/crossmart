/** The Admin API version every request uses: the latest stable release (October 2026). */
export const SHOPIFY_ADMIN_API_VERSION = '2026-10';

export const SHOPIFY_DISPLAY_NAME = 'Shopify';

/** Access scopes Crossmart requests. Least privilege: products, stock and locations only. */
export enum ShopifyScope {
  ReadProducts = 'read_products',
  WriteProducts = 'write_products',
  ReadInventory = 'read_inventory',
  WriteInventory = 'write_inventory',
  ReadLocations = 'read_locations',
}

export const SHOPIFY_REQUIRED_SCOPES: readonly ShopifyScope[] = Object.values(ShopifyScope);
export const SHOPIFY_SCOPE_SEPARATOR = ',';
/** A granted `write_x` scope implies `read_x`, and Shopify reports only the write scope. */
export const SHOPIFY_READ_SCOPE_PREFIX = 'read_';
export const SHOPIFY_WRITE_SCOPE_PREFIX = 'write_';

/** Store domains: `my-store.myshopify.com`, anchored at both ends as Shopify requires. */
export const SHOP_DOMAIN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
export const SHOP_DOMAIN_SUFFIX = '.myshopify.com';
export const SHOP_HANDLE_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]*$/;
export const SHOP_DOMAIN_MAX_LENGTH = 255;

export const SHOPIFY_AUTHORIZE_PATH = '/admin/oauth/authorize';
export const SHOPIFY_ACCESS_TOKEN_PATH = '/admin/oauth/access_token';
export const SHOPIFY_GRAPHQL_PATH = `/admin/api/${SHOPIFY_ADMIN_API_VERSION}/graphql.json`;
export const HTTPS_SCHEME = 'https://';

/** OAuth request and callback parameters. */
export enum ShopifyOAuthParam {
  ClientId = 'client_id',
  ClientSecret = 'client_secret',
  Scope = 'scope',
  RedirectUri = 'redirect_uri',
  State = 'state',
  Code = 'code',
  Shop = 'shop',
  Hmac = 'hmac',
  Expiring = 'expiring',
  GrantType = 'grant_type',
  RefreshToken = 'refresh_token',
}

/** Asks for an expiring offline token with a refresh token, required for public apps. */
export const SHOPIFY_EXPIRING_TOKEN = '1';
export const SHOPIFY_REFRESH_GRANT = 'refresh_token';

export const SHOPIFY_ACCESS_TOKEN_HEADER = 'x-shopify-access-token';

/** Webhook delivery headers, lower case as Node reports them. */
export enum ShopifyWebhookHeader {
  Hmac = 'x-shopify-hmac-sha256',
  Topic = 'x-shopify-topic',
  ShopDomain = 'x-shopify-shop-domain',
  WebhookId = 'x-shopify-webhook-id',
}

export enum ShopifyWebhookTopic {
  AppUninstalled = 'app/uninstalled',
  CustomersDataRequest = 'customers/data_request',
  CustomersRedact = 'customers/redact',
  ShopRedact = 'shop/redact',
}

/** The cost bucket of a Standard plan store; the client reads the real one from responses. */
export const SHOPIFY_GRAPHQL_BUCKET_NAME = 'admin-graphql';
export const SHOPIFY_GRAPHQL_BUCKET_CAPACITY = 1000;
export const SHOPIFY_GRAPHQL_RESTORE_PER_SECOND = 50;

export const SHOPIFY_THROTTLED_CODE = 'THROTTLED';
export const SHOPIFY_MAX_ATTEMPTS = 5;
export const SHOPIFY_BACKOFF_BASE_MS = 500;
export const SHOPIFY_BACKOFF_MAX_MS = 10_000;
export const MILLISECONDS_PER_SECOND = 1000;

/**
 * Catalog import page sizes. A query's requested cost is roughly products × (variants × 8 +
 * media × 2 + 6), and Shopify refuses queries over 1,000 points. 8 products with 10 variants
 * and 10 images ask for about 850 points, while typical products (one to three variants)
 * cost far less once Shopify refunds the difference. Products with more variants get
 * follow-up pages of `SHOPIFY_VARIANT_PAGE_SIZE`.
 */
export const SHOPIFY_CATALOG_PAGE_SIZE = 8;
export const SHOPIFY_CATALOG_FIRST_VARIANTS = 10;
export const SHOPIFY_VARIANT_PAGE_SIZE = 100;
/** Images read per product; Crossmart keeps them in Shopify's order. */
export const SHOPIFY_CATALOG_MEDIA_PER_PRODUCT = 10;

/** The option Shopify gives products without options: "Title" with "Default Title". */
export const SHOPIFY_DEFAULT_OPTION_NAME = 'Title';

export const GRAMS_PER_KILOGRAM = 1000;
export const GRAMS_PER_OUNCE = 28.349523125;
export const GRAMS_PER_POUND = 453.59237;
