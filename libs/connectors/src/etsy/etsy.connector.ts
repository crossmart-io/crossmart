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
  PriceUpdate,
  PublishedListing,
} from '../sdk/capabilities/listing-publisher.js';
import type { ExternalOrder, OrderSource } from '../sdk/capabilities/order-source.js';
import type {
  CategoryAspect,
  ChannelCategory,
  TaxonomyProvider,
} from '../sdk/capabilities/taxonomy-provider.js';
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
import { etsyShopContext } from './api/etsy-shop-context.js';
import { EtsySellingServices, EtsySyncServices } from './etsy-capabilities.js';
import {
  ETSY_API_BUCKET_CAPACITY,
  ETSY_API_BUCKET_NAME,
  ETSY_API_RESTORE_PER_SECOND,
  ETSY_DISPLAY_NAME,
  ETSY_REQUIRED_SCOPES,
  ETSY_STOCK_BATCH_SIZE,
} from './etsy.constants.js';
import { ETSY_CONTENT_LIMITS } from './etsy-content-limits.js';
import { etsyError } from './etsy-errors.js';
import { type EtsySettings, parseEtsySettings } from './etsy-settings.js';
import { normalizeEtsyShopName } from './etsy-shop-id.js';
import { EtsyOAuthClient } from './oauth/etsy-oauth.client.js';
import {
  unmetEtsyAccountRequirements,
  unmetEtsyProductRequirements,
} from './publish/etsy-publish-prerequisites.js';
import { ETSY_LISTING_ASPECTS } from './taxonomy/etsy-materials.js';

const NOT_APPROVED = 'The app was not approved on Etsy';
const OTHER_SHOP = 'You signed in to another Etsy shop than the one you named';
const MISSING_SCOPES =
  'Etsy did not grant every permission Crossmart needs. Connect again and allow them all.';

/**
 * The Etsy connector: the merchant names their shop and signs in on Etsy (OAuth 2.0 with
 * PKCE). Crossmart stores the shop and its shipping and processing profiles, publishes
 * listings with their inventory and images, reads the shop's receipts, and sends Crossmart's
 * stock back to the listings.
 */
@Injectable()
export class EtsyConnector
  implements OAuthAppConnector, ListingPublisher, TaxonomyProvider, OrderSource, InventorySync
{
  readonly channel = ChannelType.Etsy;
  readonly displayName = ETSY_DISPLAY_NAME;
  readonly authStrategy = ChannelAuthStrategy.OAuthApp;
  readonly capabilities: ReadonlySet<ChannelCapability> = new Set([
    ChannelCapability.PublishListings,
    ChannelCapability.UpdatePrice,
    ChannelCapability.ProvideTaxonomy,
    ChannelCapability.FetchOrders,
    ChannelCapability.UpdateInventory,
  ]);
  readonly requiredScopes = ETSY_REQUIRED_SCOPES;
  readonly maxBatchSize = ETSY_STOCK_BATCH_SIZE;
  readonly contentLimits = ETSY_CONTENT_LIMITS;
  readonly rateLimits: readonly RateLimitBucket[] = [
    {
      name: ETSY_API_BUCKET_NAME,
      scope: RateLimitScope.App,
      capacity: ETSY_API_BUCKET_CAPACITY,
      restorePerSecond: ETSY_API_RESTORE_PER_SECOND,
    },
  ];

  constructor(
    private readonly oauth: EtsyOAuthClient,
    private readonly selling: EtsySellingServices,
    private readonly sync: EtsySyncServices,
  ) {}

  /** False until the instance has an Etsy app (keystring and shared secret). */
  isConfigured(): boolean {
    return this.oauth.isConfigured;
  }

  /** The account handle is the shop name the merchant typed, lower-cased. */
  normalizeAccountHandle(accountHandle: string): string | null {
    return normalizeEtsyShopName(accountHandle);
  }

  authorizationUrl(request: OAuthAuthorizeRequest): URL {
    return this.oauth.authorizationUrl(request);
  }

  /** Exchanges the code with the PKCE verifier, then checks the shop is the one named. */
  async completeAuthorization(callback: OAuthCallback): Promise<ChannelAuthorization> {
    const code = callback.query[OAuthParam.Code];
    if (!code) {
      throw etsyError(ChannelErrorCode.AccessDenied, NOT_APPROVED);
    }
    const { credentials, grantedScopes } = await this.oauth.exchangeCode(code, callback);
    const granted = grantedScopes ?? [...ETSY_REQUIRED_SCOPES];
    if (!ETSY_REQUIRED_SCOPES.every((scope) => granted.includes(scope))) {
      throw etsyError(ChannelErrorCode.MissingScopes, MISSING_SCOPES);
    }
    const { accessToken } = credentials;
    const shopId = await this.sync.shop.readShopId(accessToken);
    const shop = await this.sync.shop.readShop({ accessToken, shopId });
    if (normalizeEtsyShopName(shop.shop_name) !== callback.accountHandle) {
      throw etsyError(ChannelErrorCode.InvalidAccount, OTHER_SHOP);
    }
    return { externalAccountId: shopId, credentials, grantedScopes: granted };
  }

  refreshCredentials(
    _externalAccountId: string,
    credentials: ChannelCredentials,
  ): Promise<ChannelCredentials> {
    return this.oauth.refresh(credentials);
  }

  /**
   * Etsy has no endpoint that revokes a token, so disconnecting only forgets the credentials.
   * The merchant can remove the app's access in their Etsy account settings.
   */
  revokeAccess(_session: ChannelSession): Promise<void> {
    return Promise.resolve();
  }

  async describeAccount(session: ChannelSession): Promise<ChannelAccountProfile<EtsySettings>> {
    const shopContext = await etsyShopContext(session);
    const [shop, profiles] = await Promise.all([
      this.sync.shop.readShop(shopContext),
      this.sync.shop.readProfiles(shopContext),
    ]);
    return {
      displayName: shop.shop_name,
      settings: {
        channel: ChannelType.Etsy,
        shopId: String(shop.shop_id),
        shopName: shop.shop_name,
        userId: String(shop.user_id),
        currencyCode: shop.currency_code,
        shopUrl: shop.url ?? null,
        profiles,
      },
    };
  }

  parseSettings(raw: unknown): EtsySettings {
    return parseEtsySettings(raw);
  }

  unmetAccountRequirements(settings: ChannelSettings | null): UnmetPublishRequirement[] {
    return unmetEtsyAccountRequirements(settings);
  }

  unmetProductRequirements(candidate: PublishCandidate): UnmetPublishRequirement[] {
    return unmetEtsyProductRequirements(candidate);
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

  delist(session: ChannelSession, externalId: string): Promise<void> {
    return this.selling.publisher.delist(session, externalId);
  }

  updatePrices(session: ChannelSession, updates: readonly PriceUpdate[]): Promise<void> {
    return this.selling.prices.update(session, updates);
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

  async suggestCategories(session: ChannelSession, query: string): Promise<ChannelCategory[]> {
    return this.selling.taxonomy.suggest(await session.accessToken(), query);
  }

  /** Crossmart sends one item specific to Etsy, in every category: the listing's materials. */
  categoryAspects(_session: ChannelSession, _categoryId: string): Promise<CategoryAspect[]> {
    return Promise.resolve(ETSY_LISTING_ASPECTS.map((aspect) => ({ ...aspect })));
  }
}
