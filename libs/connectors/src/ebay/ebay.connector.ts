import { Injectable } from '@nestjs/common';
import type { ChannelCredentials } from '../sdk/auth/channel-credentials.js';
import type { ChannelSession } from '../sdk/auth/channel-session.js';
import type {
  ChannelAuthorization,
  OAuthAuthorizeRequest,
  OAuthCallback,
} from '../sdk/auth/oauth-authorization.js';
import { ChannelAuthStrategy } from '../sdk/channel-auth-strategy.enum.js';
import type {
  ListingDraft,
  ListingPublisher,
  ListingReference,
  PriceUpdate,
  PublishedListing,
} from '../sdk/capabilities/listing-publisher.js';
import type { ChannelCategory, TaxonomyProvider } from '../sdk/capabilities/taxonomy-provider.js';
import { ChannelCapability } from '../sdk/channel-capability.enum.js';
import type { OAuthAppConnector } from '../sdk/channel-connector.interface.js';
import type { ChannelAccountProfile } from '../sdk/channel-settings.js';
import { ChannelType } from '../sdk/channel-type.enum.js';
import { ChannelErrorCode } from '../sdk/errors/channel-error-code.enum.js';
import { OAuthParam } from '../sdk/oauth/oauth.constants.js';
import { RateLimitScope, type RateLimitBucket } from '../sdk/rate-limit-bucket.js';
import { NO_BUSINESS_POLICIES } from './account/ebay-business-policies.js';
import type {
  EbayDefaultPoliciesRequest,
  EbayDefaultPolicyIds,
} from './account/ebay-default-policies.js';
import { ebayAccountContext } from './api/ebay-account-context.js';
import { EbayAccountServices, EbaySellingServices } from './ebay-capabilities.js';
import {
  EBAY_API_BUCKET_CAPACITY,
  EBAY_API_BUCKET_NAME,
  EBAY_API_RESTORE_PER_SECOND,
  EBAY_DISPLAY_NAME,
  EBAY_DISPLAY_NAME_SEPARATOR,
  EBAY_REQUIRED_SCOPES,
} from './ebay.constants.js';
import { type EbayAccountId, formatEbayAccountId, parseEbayAccountId } from './ebay-account-id.js';
import { ebayError } from './ebay-errors.js';
import {
  EBAY_MARKETPLACES,
  type EbayMarketplaceId,
  isEbayMarketplaceId,
  normalizeMarketplaceId,
} from './ebay-marketplace.js';
import { type EbaySettings, parseEbaySettings } from './ebay-settings.js';
import type { EbayShipFrom } from './listing/ebay-listing-defaults.js';
import { EbayOAuthClient } from './oauth/ebay-oauth.client.js';

const NOT_APPROVED = 'The app was not approved on eBay';

/**
 * The eBay connector: the merchant picks a marketplace and signs in with eBay; Crossmart
 * stores the account's name and business policies, and publishes listings through the Sell
 * Inventory API in the categories the Taxonomy API suggests. Stock sync and orders come later.
 */
@Injectable()
export class EbayConnector implements OAuthAppConnector, ListingPublisher, TaxonomyProvider {
  readonly channel = ChannelType.Ebay;
  readonly displayName = EBAY_DISPLAY_NAME;
  readonly authStrategy = ChannelAuthStrategy.OAuthApp;
  readonly capabilities: ReadonlySet<ChannelCapability> = new Set([
    ChannelCapability.PublishListings,
    ChannelCapability.UpdatePrice,
    ChannelCapability.ProvideTaxonomy,
  ]);
  readonly requiredScopes = EBAY_REQUIRED_SCOPES;
  readonly rateLimits: readonly RateLimitBucket[] = [
    {
      name: EBAY_API_BUCKET_NAME,
      scope: RateLimitScope.Connection,
      capacity: EBAY_API_BUCKET_CAPACITY,
      restorePerSecond: EBAY_API_RESTORE_PER_SECOND,
    },
  ];

  constructor(
    private readonly oauth: EbayOAuthClient,
    private readonly account: EbayAccountServices,
    private readonly selling: EbaySellingServices,
  ) {}

  isConfigured(): boolean {
    return this.oauth.isConfigured;
  }

  /** The account handle is the marketplace the merchant picked, such as `EBAY_US`. */
  normalizeAccountHandle(accountHandle: string): string | null {
    return normalizeMarketplaceId(accountHandle);
  }

  /** eBay redirects to the URL registered for the RuName, so `request.redirectUri` is unused. */
  authorizationUrl(request: OAuthAuthorizeRequest): URL {
    return this.oauth.authorizationUrl(request.state);
  }

  async completeAuthorization(callback: OAuthCallback): Promise<ChannelAuthorization> {
    const marketplaceId = this.requireMarketplace(callback.accountHandle);
    const code = callback.query[OAuthParam.Code];
    if (!code) {
      throw ebayError(ChannelErrorCode.AccessDenied, NOT_APPROVED);
    }
    const { credentials, grantedScopes } = await this.oauth.exchangeCode(code);
    const { userId } = await this.account.identity.readUser(credentials.accessToken);
    return {
      externalAccountId: formatEbayAccountId({ userId, marketplaceId }),
      credentials,
      // eBay's code grant does not list scopes; it grants all requested ones or none.
      grantedScopes: grantedScopes ?? [...EBAY_REQUIRED_SCOPES],
    };
  }

  refreshCredentials(
    _externalAccountId: string,
    credentials: ChannelCredentials,
  ): Promise<ChannelCredentials> {
    return this.oauth.refresh(credentials);
  }

  /**
   * eBay has no public endpoint that revokes a user token, so disconnecting only forgets the
   * credentials. The merchant can revoke Crossmart's access in their eBay account settings.
   */
  revokeAccess(_session: ChannelSession): Promise<void> {
    return Promise.resolve();
  }

  async describeAccount(session: ChannelSession): Promise<ChannelAccountProfile<EbaySettings>> {
    const { marketplaceId } = this.requireAccountId(session.externalAccountId);
    const accessToken = await session.accessToken();
    const [user, policies] = await Promise.all([
      this.account.identity.readUser(accessToken),
      this.account.policies.read(accessToken, marketplaceId),
    ]);
    const { currencyCode, siteLabel } = EBAY_MARKETPLACES[marketplaceId];
    return {
      displayName: `${user.username}${EBAY_DISPLAY_NAME_SEPARATOR}${siteLabel}`,
      settings: {
        channel: ChannelType.Ebay,
        marketplaceId,
        currencyCode,
        username: user.username,
        userId: user.userId,
        businessPoliciesEnabled: policies !== null,
        policies: policies ?? NO_BUSINESS_POLICIES,
      },
    };
  }

  parseSettings(raw: unknown): EbaySettings {
    return parseEbaySettings(raw);
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
    return this.selling.taxonomy.suggest(await ebayAccountContext(session), query);
  }

  /** Creates or updates the account's ship-from location; answers its `merchantLocationKey`. */
  saveShipFromLocation(session: ChannelSession, shipFrom: EbayShipFrom): Promise<string> {
    return this.account.location.save(session, shipFrom);
  }

  /** Opts the seller in to business policies; read them again with `describeAccount`. */
  optInToBusinessPolicies(session: ChannelSession): Promise<void> {
    return this.account.policySetup.optInToPolicies(session);
  }

  /**
   * Creates free standard shipping, immediate payment and 30-day return policies on the
   * account (opting it in first when `businessPoliciesEnabled` is false), or uses the ones
   * that exist already; answers the policy of each kind to list under.
   */
  createDefaultBusinessPolicies(
    session: ChannelSession,
    request: EbayDefaultPoliciesRequest,
  ): Promise<EbayDefaultPolicyIds> {
    return this.account.policySetup.createDefaults(session, request);
  }

  private requireMarketplace(accountHandle: string): EbayMarketplaceId {
    if (!isEbayMarketplaceId(accountHandle)) {
      throw ebayError(ChannelErrorCode.InvalidAccount, 'That is not an eBay marketplace');
    }
    return accountHandle;
  }

  private requireAccountId(externalAccountId: string): EbayAccountId {
    const accountId = parseEbayAccountId(externalAccountId);
    if (!accountId) {
      throw ebayError(ChannelErrorCode.InvalidAccount, 'This is not an eBay account');
    }
    return accountId;
  }
}
