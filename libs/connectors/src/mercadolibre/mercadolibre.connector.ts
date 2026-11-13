import { Injectable } from '@nestjs/common';
import type { ChannelCredentials } from '../sdk/auth/channel-credentials.js';
import type { ChannelSession } from '../sdk/auth/channel-session.js';
import type {
  ChannelAuthorization,
  OAuthAuthorizeRequest,
  OAuthCallback,
} from '../sdk/auth/oauth-authorization.js';
import type { ChannelPage } from '../sdk/capabilities/catalog.types.js';
import type {
  InventoryQuantityUpdate,
  InventorySync,
  InventoryUpdateFailure,
} from '../sdk/capabilities/inventory-sync.js';
import type {
  ListingDraft,
  ListingPublisher,
  ListingReference,
  PriceUpdate,
  PublishedListing,
} from '../sdk/capabilities/listing-publisher.js';
import type { ExternalOrder, OrderSource } from '../sdk/capabilities/order-source.js';
import type {
  CategoryAspect,
  ChannelCategory,
  TaxonomyProvider,
} from '../sdk/capabilities/taxonomy-provider.js';
import type {
  ChannelWebhookEvent,
  IncomingWebhook,
  WebhookReceiver,
} from '../sdk/capabilities/webhook-receiver.js';
import { ChannelAuthStrategy } from '../sdk/channel-auth-strategy.enum.js';
import { ChannelCapability } from '../sdk/channel-capability.enum.js';
import type { OAuthAppConnector } from '../sdk/channel-connector.interface.js';
import type { ChannelAccountProfile, ChannelSettings } from '../sdk/channel-settings.js';
import { ChannelType } from '../sdk/channel-type.enum.js';
import { ChannelErrorCode } from '../sdk/errors/channel-error-code.enum.js';
import { OAuthParam } from '../sdk/oauth/oauth.constants.js';
import type {
  PublishCandidate,
  UnmetPublishRequirement,
} from '../sdk/publishing/unmet-publish-requirement.js';
import { RateLimitScope, type RateLimitBucket } from '../sdk/rate-limit-bucket.js';
import type { MercadoLibreUser } from './account/mercadolibre-user.types.js';
import {
  MERCADOLIBRE_API_BUCKET_CAPACITY,
  MERCADOLIBRE_API_BUCKET_NAME,
  MERCADOLIBRE_API_RESTORE_PER_SECOND,
  MERCADOLIBRE_DISPLAY_NAME,
  MERCADOLIBRE_REQUIRED_SCOPES,
  MERCADOLIBRE_STOCK_BATCH_SIZE,
  MERCADOLIBRE_USER_PRODUCT_SELLER_TAG,
} from './mercadolibre.constants.js';
import { MercadoLibreApp } from './mercadolibre-app.js';
import {
  MercadoLibreSellingServices,
  MercadoLibreSyncServices,
} from './mercadolibre-capabilities.js';
import { MERCADOLIBRE_CONTENT_LIMITS } from './mercadolibre-content-limits.js';
import { mercadoLibreError } from './mercadolibre-errors.js';
import { type MercadoLibreSettings, parseMercadoLibreSettings } from './mercadolibre-settings.js';
import {
  isMercadoLibreSiteId,
  MERCADOLIBRE_SITES,
  normalizeMercadoLibreSiteId,
} from './mercadolibre-site.js';
import { MercadoLibreOAuthClient } from './oauth/mercadolibre-oauth.client.js';
import {
  unmetMercadoLibreAccountRequirements,
  unmetMercadoLibreProductRequirements,
} from './publish/mercadolibre-publish-prerequisites.js';
import { toCategoryAspects } from './taxonomy/mercadolibre-category-aspects.js';
import { requireMercadoLibreSettings } from './publish/mercadolibre-publish-prerequisites.js';

const NOT_AUTHORIZED = 'The app was not authorized on Mercado Libre';
const OTHER_SITE =
  'You signed in to a Mercado Libre account of another country than the one you chose';
const UNSUPPORTED_SITE = 'Crossmart does not support this Mercado Libre country yet';
const MISSING_SCOPES =
  'Mercado Libre did not grant every permission Crossmart needs. Check the app’s scopes.';

/**
 * The Mercado Libre connector: the merchant picks their country site and signs in there
 * (OAuth 2.0, with PKCE when the app enables it). Crossmart reads the seller, publishes items
 * in the seller's item model, sends stock and prices, and reads orders, polled and on
 * `orders_v2` notifications.
 */
@Injectable()
export class MercadoLibreConnector
  implements
    OAuthAppConnector,
    ListingPublisher,
    TaxonomyProvider,
    OrderSource,
    InventorySync,
    WebhookReceiver
{
  readonly channel = ChannelType.MercadoLibre;
  readonly displayName = MERCADOLIBRE_DISPLAY_NAME;
  readonly authStrategy = ChannelAuthStrategy.OAuthApp;
  readonly capabilities: ReadonlySet<ChannelCapability> = new Set([
    ChannelCapability.PublishListings,
    ChannelCapability.UpdatePrice,
    ChannelCapability.ProvideTaxonomy,
    ChannelCapability.FetchOrders,
    ChannelCapability.UpdateInventory,
    ChannelCapability.ReceiveWebhooks,
  ]);
  readonly requiredScopes = MERCADOLIBRE_REQUIRED_SCOPES;
  readonly maxBatchSize = MERCADOLIBRE_STOCK_BATCH_SIZE;
  readonly contentLimits = MERCADOLIBRE_CONTENT_LIMITS;
  readonly rateLimits: readonly RateLimitBucket[] = [
    {
      name: MERCADOLIBRE_API_BUCKET_NAME,
      scope: RateLimitScope.App,
      capacity: MERCADOLIBRE_API_BUCKET_CAPACITY,
      restorePerSecond: MERCADOLIBRE_API_RESTORE_PER_SECOND,
    },
  ];

  constructor(
    private readonly app: MercadoLibreApp,
    private readonly oauth: MercadoLibreOAuthClient,
    private readonly selling: MercadoLibreSellingServices,
    private readonly sync: MercadoLibreSyncServices,
  ) {}

  /** False until the instance has a Mercado Libre app (App ID and Secret Key). */
  isConfigured(): boolean {
    return this.oauth.isConfigured;
  }

  /** The account handle is the site the merchant picked, such as `MLM`. */
  normalizeAccountHandle(accountHandle: string): string | null {
    return normalizeMercadoLibreSiteId(accountHandle);
  }

  authorizationUrl(request: OAuthAuthorizeRequest): URL {
    const siteId = normalizeMercadoLibreSiteId(request.accountHandle);
    if (!siteId) throw mercadoLibreError(ChannelErrorCode.InvalidAccount, UNSUPPORTED_SITE);
    return this.oauth.authorizationUrl({ ...request, siteId });
  }

  /** Exchanges the code, then checks the seller sells on the site the merchant picked. */
  async completeAuthorization(callback: OAuthCallback): Promise<ChannelAuthorization> {
    const code = callback.query[OAuthParam.Code];
    if (!code) throw mercadoLibreError(ChannelErrorCode.AccessDenied, NOT_AUTHORIZED);
    const grant = await this.oauth.exchangeCode(code, callback.redirectUri, callback.codeVerifier);
    const granted = grant.grantedScopes ?? [...MERCADOLIBRE_REQUIRED_SCOPES];
    if (!MERCADOLIBRE_REQUIRED_SCOPES.every((scope) => granted.includes(scope))) {
      throw mercadoLibreError(ChannelErrorCode.MissingScopes, MISSING_SCOPES);
    }
    const user = await this.sync.user.readMe(grant.credentials.accessToken);
    if (user.site_id !== callback.accountHandle) {
      throw mercadoLibreError(ChannelErrorCode.InvalidAccount, OTHER_SITE);
    }
    return {
      externalAccountId: String(user.id),
      credentials: grant.credentials,
      grantedScopes: granted,
    };
  }

  refreshCredentials(
    _externalAccountId: string,
    credentials: ChannelCredentials,
  ): Promise<ChannelCredentials> {
    return this.oauth.refresh(credentials);
  }

  /** Removes the app's authorization from the seller's account. */
  async revokeAccess(session: ChannelSession): Promise<void> {
    const appId = this.app.settings().clientId;
    await this.sync.user.revokeGrant(await session.accessToken(), session.externalAccountId, appId);
  }

  async describeAccount(
    session: ChannelSession,
  ): Promise<ChannelAccountProfile<MercadoLibreSettings>> {
    const user = await this.sync.user.readMe(await session.accessToken());
    return { displayName: user.nickname, settings: toSettings(user) };
  }

  parseSettings(raw: unknown): MercadoLibreSettings {
    return parseMercadoLibreSettings(raw);
  }

  unmetAccountRequirements(settings: ChannelSettings | null): UnmetPublishRequirement[] {
    return unmetMercadoLibreAccountRequirements(settings);
  }

  unmetProductRequirements(candidate: PublishCandidate): UnmetPublishRequirement[] {
    return unmetMercadoLibreProductRequirements(candidate);
  }

  publish(session: ChannelSession, draft: ListingDraft): Promise<PublishedListing> {
    return this.selling.publisher.publish(session, draft);
  }

  update(
    session: ChannelSession,
    externalId: string,
    draft: ListingDraft,
  ): Promise<PublishedListing> {
    return this.selling.publisher.update(session, externalId, draft);
  }

  delist(session: ChannelSession, externalId: string, reference?: ListingReference): Promise<void> {
    return this.selling.publisher.delist(session, externalId, reference);
  }

  updatePrices(session: ChannelSession, updates: readonly PriceUpdate[]): Promise<void> {
    return this.selling.prices.update(session, updates);
  }

  async suggestCategories(session: ChannelSession, query: string): Promise<ChannelCategory[]> {
    const { siteId } = requireMercadoLibreSettings(session.settings);
    return this.selling.categories.suggest(await session.accessToken(), siteId, query);
  }

  async categoryAspects(session: ChannelSession, categoryId: string): Promise<CategoryAspect[]> {
    const accessToken = await session.accessToken();
    return toCategoryAspects(await this.selling.attributes.read(accessToken, categoryId));
  }

  fetchOrders(
    session: ChannelSession,
    updatedSince: Date,
    cursor: string | null,
  ): Promise<ChannelPage<ExternalOrder>> {
    return this.sync.orders.fetchOrders(session, updatedSince, cursor);
  }

  fetchOrder(session: ChannelSession, externalId: string): Promise<ExternalOrder | null> {
    return this.sync.orders.fetchOrder(session, externalId);
  }

  setQuantities(
    session: ChannelSession,
    updates: readonly InventoryQuantityUpdate[],
  ): Promise<InventoryUpdateFailure[]> {
    return this.sync.stock.setQuantities(session, updates);
  }

  /** Notifications are unsigned; see `MercadoLibreNotificationParser`. */
  verifyWebhook(webhook: IncomingWebhook): ChannelWebhookEvent | null {
    return this.sync.notifications.parse(webhook);
  }
}

/** The seller's settings; a site Crossmart does not support cannot be connected. */
function toSettings(user: MercadoLibreUser): MercadoLibreSettings {
  if (!isMercadoLibreSiteId(user.site_id)) {
    throw mercadoLibreError(ChannelErrorCode.InvalidAccount, UNSUPPORTED_SITE);
  }
  return {
    channel: ChannelType.MercadoLibre,
    userId: String(user.id),
    nickname: user.nickname,
    siteId: user.site_id,
    currencyCode: MERCADOLIBRE_SITES[user.site_id].currencyCode,
    permalink: user.permalink ?? null,
    userProductSeller: user.tags.includes(MERCADOLIBRE_USER_PRODUCT_SELLER_TAG),
  };
}
