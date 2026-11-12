import { Injectable } from '@nestjs/common';
import type { ChannelSession } from '../sdk/auth/channel-session.js';
import type {
  SellerCredentialValues,
  VerifiedSellerAccount,
} from '../sdk/auth/seller-credentials.js';
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
import { ChannelAuthStrategy } from '../sdk/channel-auth-strategy.enum.js';
import { ChannelCapability } from '../sdk/channel-capability.enum.js';
import type { SellerCredentialsConnector } from '../sdk/channel-connector.interface.js';
import type { ChannelAccountProfile, ChannelSettings } from '../sdk/channel-settings.js';
import { ChannelType } from '../sdk/channel-type.enum.js';
import type {
  PublishCandidate,
  UnmetPublishRequirement,
} from '../sdk/publishing/unmet-publish-requirement.js';
import { RateLimitScope, type RateLimitBucket } from '../sdk/rate-limit-bucket.js';
import { FALABELLA_CREDENTIAL_FIELDS } from './account/falabella-credentials.js';
import { falabellaAccount } from './api/falabella-account.js';
import {
  FALABELLA_DISPLAY_NAME,
  FALABELLA_FEED_BATCH_SIZE,
  FALABELLA_FEED_BUCKET_CAPACITY,
  FALABELLA_FEED_BUCKET_NAME,
  FALABELLA_FEED_RESTORE_PER_SECOND,
} from './falabella.constants.js';
import { FalabellaSellingServices, FalabellaSyncServices } from './falabella-capabilities.js';
import { type FalabellaSettings, parseFalabellaSettings } from './falabella-settings.js';
import {
  unmetFalabellaAccountRequirements,
  unmetFalabellaProductRequirements,
} from './publish/falabella-publish-prerequisites.js';
import { toCategoryAspects } from './taxonomy/falabella-attributes.js';

/**
 * The Falabella connector (Chile, Colombia, Peru). The merchant pastes their Seller Center
 * user id, API key, seller id and country; every request is signed with the key. Crossmart
 * publishes products with their images, prices and stock as feeds, reads the seller's orders
 * and sends Crossmart's stock back.
 */
@Injectable()
export class FalabellaConnector
  implements
    SellerCredentialsConnector,
    ListingPublisher,
    TaxonomyProvider,
    OrderSource,
    InventorySync
{
  readonly channel = ChannelType.Falabella;
  readonly displayName = FALABELLA_DISPLAY_NAME;
  readonly authStrategy = ChannelAuthStrategy.SellerCredentials;
  readonly credentialFields = FALABELLA_CREDENTIAL_FIELDS;
  readonly capabilities: ReadonlySet<ChannelCapability> = new Set([
    ChannelCapability.PublishListings,
    ChannelCapability.UpdatePrice,
    ChannelCapability.ProvideTaxonomy,
    ChannelCapability.FetchOrders,
    ChannelCapability.UpdateInventory,
  ]);
  readonly requiredScopes: readonly string[] = [];
  readonly maxBatchSize = FALABELLA_FEED_BATCH_SIZE;
  readonly rateLimits: readonly RateLimitBucket[] = [
    {
      name: FALABELLA_FEED_BUCKET_NAME,
      scope: RateLimitScope.Connection,
      capacity: FALABELLA_FEED_BUCKET_CAPACITY,
      restorePerSecond: FALABELLA_FEED_RESTORE_PER_SECOND,
    },
  ];

  constructor(
    private readonly selling: FalabellaSellingServices,
    private readonly sync: FalabellaSyncServices,
  ) {}

  /** Nothing to configure: each merchant brings their own keys. */
  isConfigured(): boolean {
    return true;
  }

  verifyCredentials(values: SellerCredentialValues): Promise<VerifiedSellerAccount> {
    return this.sync.account.verify(values);
  }

  async describeAccount(
    session: ChannelSession,
  ): Promise<ChannelAccountProfile<FalabellaSettings>> {
    return this.sync.account.describe(await falabellaAccount(session));
  }

  parseSettings(raw: unknown): FalabellaSettings {
    return parseFalabellaSettings(raw);
  }

  unmetAccountRequirements(settings: ChannelSettings | null): UnmetPublishRequirement[] {
    return unmetFalabellaAccountRequirements(settings);
  }

  unmetProductRequirements(candidate: PublishCandidate): UnmetPublishRequirement[] {
    return unmetFalabellaProductRequirements(candidate);
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

  readQuantities(session: ChannelSession, ids: readonly string[]): Promise<Map<string, number>> {
    return this.sync.stock.readQuantities(session, ids);
  }

  async suggestCategories(session: ChannelSession, query: string): Promise<ChannelCategory[]> {
    return this.selling.taxonomy.suggest(await falabellaAccount(session), query);
  }

  async categoryAspects(session: ChannelSession, categoryId: string): Promise<CategoryAspect[]> {
    const attributes = await this.selling.taxonomy.attributes(
      await falabellaAccount(session),
      categoryId,
    );
    return toCategoryAspects(attributes);
  }
}
