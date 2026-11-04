import { ChannelFeature, type OptionalScope } from '../sdk/channel-feature.enum.js';

/** The Admin API version every request uses: the latest stable release (October 2026). */
export const SHOPIFY_ADMIN_API_VERSION = '2026-10';

export const SHOPIFY_DISPLAY_NAME = 'Shopify';

/** Access scopes Crossmart requests. Least privilege: products, stock, locations, sales channels. */
export enum ShopifyScope {
  ReadProducts = 'read_products',
  WriteProducts = 'write_products',
  ReadInventory = 'read_inventory',
  WriteInventory = 'write_inventory',
  ReadLocations = 'read_locations',
  /** Puts published products on the Online Store sales channel (covers `read_publications`). */
  WritePublications = 'write_publications',
  /** Reads orders to reserve their stock. Order data is protected customer data (level 1). */
  ReadOrders = 'read_orders',
}

export const SHOPIFY_REQUIRED_SCOPES: readonly ShopifyScope[] = [
  ShopifyScope.ReadProducts,
  ShopifyScope.WriteProducts,
  ShopifyScope.ReadInventory,
  ShopifyScope.WriteInventory,
  ShopifyScope.ReadLocations,
];
/**
 * Stores connected before the scope was added keep working without it; their products are
 * created but not shown in the Online Store until the merchant approves the app again.
 */
export const SHOPIFY_OPTIONAL_SCOPES = [
  { scope: ShopifyScope.WritePublications, feature: ChannelFeature.StorefrontVisibility },
  { scope: ShopifyScope.ReadOrders, feature: ChannelFeature.OrderSync },
] as const satisfies readonly OptionalScope[];
/** What the install asks for: the required scopes, then the optional ones. */
export const SHOPIFY_REQUESTED_SCOPES: readonly ShopifyScope[] = [
  ...SHOPIFY_REQUIRED_SCOPES,
  ...SHOPIFY_OPTIONAL_SCOPES.map(({ scope }) => scope),
];
/** The sales channel a store's shoppers browse, as its publication is named in the Admin API. */
export const SHOPIFY_ONLINE_STORE_NAME = 'Online Store';
/** Publications read to find the Online Store; stores have a handful of sales channels. */
export const SHOPIFY_PUBLICATIONS_PAGE_SIZE = 50;
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
  OrdersCreate = 'orders/create',
  OrdersUpdated = 'orders/updated',
  OrdersCancelled = 'orders/cancelled',
}

/** Orders read per page when polling; each carries up to `SHOPIFY_ORDER_LINES_PAGE_SIZE` lines. */
export const SHOPIFY_ORDERS_PAGE_SIZE = 25;
/** Lines read per order. Orders with more are rare; their extra lines are not read yet. */
export const SHOPIFY_ORDER_LINES_PAGE_SIZE = 100;
/** The search syntax `orders(query:)` filters by update time with. */
export const SHOPIFY_ORDERS_UPDATED_SINCE_FIELD = 'updated_at:>=';

/** The cost bucket of a Standard plan store; the client reads the real one from responses. */
export const SHOPIFY_GRAPHQL_BUCKET_NAME = 'admin-graphql';
export const SHOPIFY_GRAPHQL_BUCKET_CAPACITY = 1000;
export const SHOPIFY_GRAPHQL_RESTORE_PER_SECOND = 50;

export const SHOPIFY_THROTTLED_CODE = 'THROTTLED';
export const SHOPIFY_MAX_ATTEMPTS = 5;
export const SHOPIFY_BACKOFF_BASE_MS = 500;
export const SHOPIFY_BACKOFF_MAX_MS = 10_000;

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

/** `inventorySetQuantities` accepts at most this many quantities per call. */
export const SHOPIFY_INVENTORY_BATCH_SIZE = 250;
export const SHOPIFY_AVAILABLE_QUANTITY_NAME = 'available';
export const SHOPIFY_INVENTORY_REASON = 'correction';
/** How long the primary location is cached per connection before it is read again. */
export const SHOPIFY_LOCATION_CACHE_TTL_MS = 10 * 60 * 1000;
/** How long the Online Store publication is cached per connection. */
export const SHOPIFY_PUBLICATION_CACHE_TTL_MS = SHOPIFY_LOCATION_CACHE_TTL_MS;
/** The value Shopify gives that placeholder option. */
export const SHOPIFY_DEFAULT_OPTION_VALUE = 'Default Title';
/** Shopify positions start at 1. */
export const SHOPIFY_FIRST_POSITION = 1;
/** Joins several user errors into one message. */
export const SHOPIFY_USER_ERROR_SEPARATOR = '; ';
/** The admin URL of a product, for listings that are not on the online store. */
export const SHOPIFY_ADMIN_PRODUCT_PATH = '/admin/products/';
