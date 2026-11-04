import { Injectable } from '@nestjs/common';
import type { ChannelCredentials } from '../sdk/auth/channel-credentials.js';
import type { ChannelSession } from '../sdk/auth/channel-session.js';
import type {
  ChannelAuthorization,
  OAuthAuthorizeRequest,
  OAuthCallback,
} from '../sdk/auth/oauth-authorization.js';
import { ChannelAuthStrategy } from '../sdk/channel-auth-strategy.enum.js';
import type { ChannelCapability } from '../sdk/channel-capability.enum.js';
import type { OAuthAppConnector } from '../sdk/channel-connector.interface.js';
import type { ChannelAccountProfile } from '../sdk/channel-settings.js';
import { ChannelType } from '../sdk/channel-type.enum.js';
import { ChannelErrorCode } from '../sdk/errors/channel-error-code.enum.js';
import { RateLimitScope, type RateLimitBucket } from '../sdk/rate-limit-bucket.js';
import { NO_BUSINESS_POLICIES } from './account/ebay-business-policies.js';
import { EbayBusinessPoliciesReader } from './account/ebay-business-policies.reader.js';
import { EbayIdentityReader } from './account/ebay-identity.reader.js';
import {
  EBAY_API_BUCKET_CAPACITY,
  EBAY_API_BUCKET_NAME,
  EBAY_API_RESTORE_PER_SECOND,
  EBAY_DISPLAY_NAME,
  EBAY_DISPLAY_NAME_SEPARATOR,
  EBAY_REQUIRED_SCOPES,
  EbayOAuthParam,
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
import { EbayOAuthClient } from './oauth/ebay-oauth.client.js';

/**
 * The eBay connector, phase one: the merchant picks a marketplace, signs in with eBay, and
 * Crossmart stores the connection with the account's name and business policies. Publishing,
 * stock and orders come later, so it declares no capabilities yet.
 */
@Injectable()
export class EbayConnector implements OAuthAppConnector {
  readonly channel = ChannelType.Ebay;
  readonly displayName = EBAY_DISPLAY_NAME;
  readonly authStrategy = ChannelAuthStrategy.OAuthApp;
  readonly capabilities: ReadonlySet<ChannelCapability> = new Set();
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
    private readonly identity: EbayIdentityReader,
    private readonly policies: EbayBusinessPoliciesReader,
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
    const code = callback.query[EbayOAuthParam.Code];
    if (!code) {
      throw ebayError(ChannelErrorCode.AccessDenied, 'The app was not approved on eBay');
    }
    const credentials = await this.oauth.exchangeCode(code);
    const { userId } = await this.identity.readUser(credentials.accessToken);
    return {
      externalAccountId: formatEbayAccountId({ userId, marketplaceId }),
      credentials,
      // eBay's code grant does not list scopes; it grants all requested ones or none.
      grantedScopes: [...EBAY_REQUIRED_SCOPES],
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
      this.identity.readUser(accessToken),
      this.policies.read(accessToken, marketplaceId),
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
