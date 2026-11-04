import type { ExternalOrder, OrderSource } from '../sdk/capabilities/order-source.js';
import { Injectable } from '@nestjs/common';
import { ChannelAuthStrategy } from '../sdk/channel-auth-strategy.enum.js';
import { ChannelCapability } from '../sdk/channel-capability.enum.js';
import type { OAuthAppConnector } from '../sdk/channel-connector.interface.js';
import type { ChannelAccountProfile } from '../sdk/channel-settings.js';
import { ChannelType } from '../sdk/channel-type.enum.js';
import type { ChannelCredentials } from '../sdk/auth/channel-credentials.js';
import type { ChannelSession } from '../sdk/auth/channel-session.js';
import type {
  ChannelAuthorization,
  OAuthAuthorizeRequest,
  OAuthCallback,
} from '../sdk/auth/oauth-authorization.js';
import type { CatalogSource } from '../sdk/capabilities/catalog-source.js';
import type { ChannelPage, ExternalProduct } from '../sdk/capabilities/catalog.types.js';
import type {
  InventoryQuantityUpdate,
  InventorySync,
  InventoryUpdateFailure,
} from '../sdk/capabilities/inventory-sync.js';
import type {
  ListingDraft,
  ListingPublisher,
  PriceUpdate,
  PublishedListing,
} from '../sdk/capabilities/listing-publisher.js';
import type {
  ChannelWebhookEvent,
  IncomingWebhook,
  WebhookReceiver,
} from '../sdk/capabilities/webhook-receiver.js';
import { ChannelError } from '../sdk/errors/channel-error.js';
import { ChannelErrorCode } from '../sdk/errors/channel-error-code.enum.js';
import { RateLimitScope, type RateLimitBucket } from '../sdk/rate-limit-bucket.js';
import { APP_UNINSTALL_MUTATION } from './graphql/app-uninstall.mutation.js';
import { SHOP_QUERY, type ShopData } from './graphql/shop.query.js';
import { ShopifyAdminClient } from './graphql/shopify-admin.client.js';
import { ShopifyOAuthClient } from './oauth/shopify-oauth.client.js';
import { ShopifyStoreCapabilities } from './shopify-store-capabilities.js';
import { isShopDomain, normalizeShopDomain } from './shop-domain.js';
import {
  SHOPIFY_DISPLAY_NAME,
  SHOPIFY_GRAPHQL_BUCKET_CAPACITY,
  SHOPIFY_GRAPHQL_BUCKET_NAME,
  SHOPIFY_GRAPHQL_RESTORE_PER_SECOND,
  SHOPIFY_OPTIONAL_SCOPES,
  SHOPIFY_REQUIRED_SCOPES,
  ShopifyOAuthParam,
} from './shopify.constants.js';
import { missingScopes } from './shopify-scopes.js';
import { parseShopifySettings, type ShopifySettings } from './shopify-settings.js';
import { ShopifyWebhookParser } from './webhooks/shopify-webhook-parser.js';

function shopifyError(code: ChannelErrorCode, message: string): ChannelError {
  return new ChannelError(ChannelType.Shopify, code, message);
}

/**
 * The Shopify connector: OAuth install, store details, webhooks, catalog import, publishing
 * listings, setting stock and reading orders. Each capability is implemented by its own class and delegated to here.
 */
@Injectable()
export class ShopifyConnector
  implements
    OAuthAppConnector,
    WebhookReceiver,
    CatalogSource,
    ListingPublisher,
    InventorySync,
    OrderSource
{
  readonly channel = ChannelType.Shopify;
  readonly displayName = SHOPIFY_DISPLAY_NAME;
  readonly authStrategy = ChannelAuthStrategy.OAuthApp;
  readonly capabilities: ReadonlySet<ChannelCapability> = new Set([
    ChannelCapability.ReceiveWebhooks,
    ChannelCapability.ImportCatalog,
    ChannelCapability.PublishListings,
    ChannelCapability.UpdatePrice,
    ChannelCapability.UpdateInventory,
    ChannelCapability.FetchOrders,
  ]);
  readonly requiredScopes = SHOPIFY_REQUIRED_SCOPES;
  readonly optionalScopes = SHOPIFY_OPTIONAL_SCOPES;
  readonly rateLimits: readonly RateLimitBucket[] = [
    {
      name: SHOPIFY_GRAPHQL_BUCKET_NAME,
      scope: RateLimitScope.Connection,
      capacity: SHOPIFY_GRAPHQL_BUCKET_CAPACITY,
      restorePerSecond: SHOPIFY_GRAPHQL_RESTORE_PER_SECOND,
    },
  ];

  constructor(
    private readonly oauth: ShopifyOAuthClient,
    private readonly admin: ShopifyAdminClient,
    private readonly webhooks: ShopifyWebhookParser,
    private readonly store: ShopifyStoreCapabilities,
  ) {}

  get maxBatchSize(): number {
    return this.store.inventory.maxBatchSize;
  }

  isConfigured(): boolean {
    return this.oauth.isConfigured;
  }

  normalizeAccountHandle(accountHandle: string): string | null {
    return normalizeShopDomain(accountHandle);
  }

  authorizationUrl(request: OAuthAuthorizeRequest): URL {
    return this.oauth.authorizationUrl({ ...request, shopDomain: request.accountHandle });
  }

  async completeAuthorization(callback: OAuthCallback): Promise<ChannelAuthorization> {
    const { query } = callback;
    if (!this.oauth.verifyCallback(query)) {
      throw shopifyError(
        ChannelErrorCode.InvalidSignature,
        'The Shopify callback is not signed by Shopify',
      );
    }
    const shopDomain = query[ShopifyOAuthParam.Shop];
    const code = query[ShopifyOAuthParam.Code];
    if (!shopDomain || !isShopDomain(shopDomain) || !code) {
      throw shopifyError(
        ChannelErrorCode.InvalidAccount,
        'The Shopify callback names no valid store',
      );
    }
    const grant = await this.oauth.exchangeCode(shopDomain, code);
    const missing = missingScopes(grant.grantedScopes, this.requiredScopes);
    if (missing.length > 0) {
      throw shopifyError(
        ChannelErrorCode.MissingScopes,
        `Shopify did not grant ${missing.join(', ')}`,
      );
    }
    return { externalAccountId: shopDomain.toLowerCase(), ...grant };
  }

  async refreshCredentials(
    externalAccountId: string,
    credentials: ChannelCredentials,
  ): Promise<ChannelCredentials> {
    if (!credentials.refreshToken) {
      throw shopifyError(
        ChannelErrorCode.CredentialsRejected,
        'This connection has no refresh token',
      );
    }
    const grant = await this.oauth.refresh(externalAccountId, credentials.refreshToken);
    return grant.credentials;
  }

  async revokeAccess(session: ChannelSession): Promise<void> {
    const { appUninstall } = await this.admin.request(session, APP_UNINSTALL_MUTATION);
    const [userError] = appUninstall.userErrors;
    if (userError) {
      throw shopifyError(ChannelErrorCode.RequestRejected, userError.message);
    }
  }

  async describeAccount(session: ChannelSession): Promise<ChannelAccountProfile<ShopifySettings>> {
    const data = await this.admin.request(session, SHOP_QUERY);
    return { displayName: data.shop.name, settings: this.toSettings(data) };
  }

  parseSettings(raw: unknown): ShopifySettings {
    return parseShopifySettings(raw);
  }

  verifyWebhook(webhook: IncomingWebhook): ChannelWebhookEvent | null {
    return this.webhooks.parse(webhook);
  }

  fetchProducts(
    session: ChannelSession,
    cursor: string | null,
  ): Promise<ChannelPage<ExternalProduct>> {
    return this.store.catalog.fetchProducts(session, cursor);
  }

  publish(session: ChannelSession, draft: ListingDraft): Promise<PublishedListing> {
    return this.store.publisher.publish(session, draft);
  }

  update(
    session: ChannelSession,
    externalId: string,
    draft: ListingDraft,
  ): Promise<PublishedListing> {
    return this.store.publisher.update(session, externalId, draft);
  }

  delist(session: ChannelSession, externalId: string): Promise<void> {
    return this.store.publisher.delist(session, externalId);
  }

  updatePrices(session: ChannelSession, updates: readonly PriceUpdate[]): Promise<void> {
    return this.store.publisher.updatePrices(session, updates);
  }

  setQuantities(
    session: ChannelSession,
    updates: readonly InventoryQuantityUpdate[],
  ): Promise<InventoryUpdateFailure[]> {
    return this.store.inventory.setQuantities(session, updates);
  }

  readQuantities(
    session: ChannelSession,
    externalInventoryIds: readonly string[],
  ): Promise<Map<string, number>> {
    return this.store.inventory.readQuantities(session, externalInventoryIds);
  }

  fetchOrders(
    session: ChannelSession,
    updatedSince: Date,
    cursor: string | null,
  ): Promise<ChannelPage<ExternalOrder>> {
    return this.store.orders.fetchOrders(session, updatedSince, cursor);
  }

  fetchOrder(session: ChannelSession, externalId: string): Promise<ExternalOrder | null> {
    return this.store.orders.fetchOrder(session, externalId);
  }

  private toSettings({ shop, location }: ShopData): ShopifySettings {
    return {
      channel: ChannelType.Shopify,
      shopName: shop.name,
      currencyCode: shop.currencyCode,
      ianaTimezone: shop.ianaTimezone,
      primaryDomainUrl: shop.primaryDomain?.url ?? null,
      primaryLocation: location ? { id: location.id, name: location.name } : null,
    };
  }
}
