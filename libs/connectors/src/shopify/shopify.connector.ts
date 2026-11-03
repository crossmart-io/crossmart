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
  ChannelWebhookEvent,
  IncomingWebhook,
  WebhookReceiver,
} from '../sdk/capabilities/webhook-receiver.js';
import { ChannelError } from '../sdk/errors/channel-error.js';
import { ChannelErrorCode } from '../sdk/errors/channel-error-code.enum.js';
import { RateLimitScope, type RateLimitBucket } from '../sdk/rate-limit-bucket.js';
import { ShopifyCatalogReader } from './catalog/shopify-catalog.reader.js';
import { APP_UNINSTALL_MUTATION } from './graphql/app-uninstall.mutation.js';
import { SHOP_QUERY, type ShopData } from './graphql/shop.query.js';
import { ShopifyAdminClient } from './graphql/shopify-admin.client.js';
import { ShopifyOAuthClient } from './oauth/shopify-oauth.client.js';
import { isShopDomain, normalizeShopDomain } from './shop-domain.js';
import {
  SHOPIFY_DISPLAY_NAME,
  SHOPIFY_GRAPHQL_BUCKET_CAPACITY,
  SHOPIFY_GRAPHQL_BUCKET_NAME,
  SHOPIFY_GRAPHQL_RESTORE_PER_SECOND,
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
 * The Shopify connector: OAuth install, store details, webhooks and catalog import. Listing
 * publishing adds its capabilities here as it is built.
 */
@Injectable()
export class ShopifyConnector implements OAuthAppConnector, WebhookReceiver, CatalogSource {
  readonly channel = ChannelType.Shopify;
  readonly displayName = SHOPIFY_DISPLAY_NAME;
  readonly authStrategy = ChannelAuthStrategy.OAuthApp;
  readonly capabilities: ReadonlySet<ChannelCapability> = new Set([
    ChannelCapability.ReceiveWebhooks,
    ChannelCapability.ImportCatalog,
  ]);
  readonly requiredScopes = SHOPIFY_REQUIRED_SCOPES;
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
    private readonly catalog: ShopifyCatalogReader,
  ) {}

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
    return this.catalog.fetchProducts(session, cursor);
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
