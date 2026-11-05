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
import { ChannelCapability } from '../sdk/channel-capability.enum.js';
import type { OAuthAppConnector } from '../sdk/channel-connector.interface.js';
import type { ChannelAccountProfile } from '../sdk/channel-settings.js';
import { ChannelType } from '../sdk/channel-type.enum.js';
import { ChannelErrorCode } from '../sdk/errors/channel-error-code.enum.js';
import { OAuthParam } from '../sdk/oauth/oauth.constants.js';
import { RateLimitScope, type RateLimitBucket } from '../sdk/rate-limit-bucket.js';
import { GoogleAccountReader } from './account/google-account.reader.js';
import { GoogleDataSourceWriter } from './account/google-data-source.writer.js';
import {
  GOOGLE_MERCHANT_DISPLAY_NAME,
  GOOGLE_REQUIRED_SCOPES,
  MERCHANT_ACCOUNT_ID_PATTERN,
  MERCHANT_API_BUCKET_CAPACITY,
  MERCHANT_API_BUCKET_NAME,
  MERCHANT_API_RESTORE_PER_SECOND,
} from './google-merchant.constants.js';
import {
  GOOGLE_COUNTRY_MARKETS,
  type GoogleTargetCountry,
  targetCountryOf,
} from './google-merchant-country.js';
import { googleMerchantError } from './google-merchant-errors.js';
import {
  type GoogleMerchantSettings,
  parseGoogleMerchantSettings,
} from './google-merchant-settings.js';
import { GoogleOAuthClient } from './oauth/google-oauth.client.js';
import { GoogleListingPublisher } from './publish/google-listing-publisher.js';
import { GOOGLE_MERCHANT_CONTENT_LIMITS } from './google-merchant-content-limits.js';

/** Characters merchants type around the id, as Merchant Center shows it: `123-456-789`. */
const ACCOUNT_ID_NOISE = /[\s-]/g;
const NOT_APPROVED = 'The app was not approved on Google';

/**
 * The Google Merchant Center connector: the merchant types their Merchant Center account id
 * and signs in with Google; Crossmart reads the account, creates an API data source for the
 * country it lists in, and publishes each variant as an offer through the Merchant API.
 */
@Injectable()
export class GoogleMerchantConnector implements OAuthAppConnector, ListingPublisher {
  readonly channel = ChannelType.GoogleMerchant;
  readonly displayName = GOOGLE_MERCHANT_DISPLAY_NAME;
  readonly authStrategy = ChannelAuthStrategy.OAuthApp;
  readonly capabilities: ReadonlySet<ChannelCapability> = new Set([
    ChannelCapability.PublishListings,
    ChannelCapability.UpdatePrice,
  ]);
  readonly requiredScopes = GOOGLE_REQUIRED_SCOPES;
  readonly contentLimits = GOOGLE_MERCHANT_CONTENT_LIMITS;
  readonly rateLimits: readonly RateLimitBucket[] = [
    {
      name: MERCHANT_API_BUCKET_NAME,
      scope: RateLimitScope.Connection,
      capacity: MERCHANT_API_BUCKET_CAPACITY,
      restorePerSecond: MERCHANT_API_RESTORE_PER_SECOND,
    },
  ];

  constructor(
    private readonly oauth: GoogleOAuthClient,
    private readonly accounts: GoogleAccountReader,
    private readonly dataSources: GoogleDataSourceWriter,
    private readonly publisher: GoogleListingPublisher,
  ) {}

  isConfigured(): boolean {
    return this.oauth.isConfigured;
  }

  /** The account handle is the Merchant Center account id, digits only. */
  normalizeAccountHandle(accountHandle: string): string | null {
    const accountId = accountHandle.replace(ACCOUNT_ID_NOISE, '');
    return MERCHANT_ACCOUNT_ID_PATTERN.test(accountId) ? accountId : null;
  }

  authorizationUrl(request: OAuthAuthorizeRequest): URL {
    return this.oauth.authorizationUrl(request.state, request.redirectUri);
  }

  /** Exchanges the code, then checks the signed-in user can manage the account typed. */
  async completeAuthorization(callback: OAuthCallback): Promise<ChannelAuthorization> {
    const code = callback.query[OAuthParam.Code];
    if (!code || callback.query[OAuthParam.Error]) {
      throw googleMerchantError(ChannelErrorCode.AccessDenied, NOT_APPROVED);
    }
    const { credentials, grantedScopes } = await this.oauth.exchangeCode(
      code,
      callback.redirectUri,
    );
    await this.accounts.read(credentials.accessToken, callback.accountHandle);
    return {
      externalAccountId: callback.accountHandle,
      credentials,
      grantedScopes: grantedScopes ?? [],
    };
  }

  refreshCredentials(
    _externalAccountId: string,
    credentials: ChannelCredentials,
  ): Promise<ChannelCredentials> {
    return this.oauth.refresh(credentials);
  }

  /** Revoking the access token revokes the whole grant, refresh token included. */
  async revokeAccess(session: ChannelSession): Promise<void> {
    await this.oauth.revoke(await session.accessToken());
  }

  async describeAccount(
    session: ChannelSession,
  ): Promise<ChannelAccountProfile<GoogleMerchantSettings>> {
    const profile = await this.accounts.read(
      await session.accessToken(),
      session.externalAccountId,
    );
    const country = targetCountryOf(profile.regionCode);
    const { currencyCode, contentLanguage } = GOOGLE_COUNTRY_MARKETS[country];
    return {
      displayName: profile.accountName,
      settings: {
        channel: ChannelType.GoogleMerchant,
        accountId: profile.accountId,
        accountName: profile.accountName,
        homepageUri: profile.homepageUri,
        homepageClaimed: profile.homepageClaimed,
        country,
        currencyCode,
        contentLanguage,
      },
    };
  }

  parseSettings(raw: unknown): GoogleMerchantSettings {
    return parseGoogleMerchantSettings(raw);
  }

  /** Creates the API data source the country's offers are published into; answers its id. */
  createDataSource(session: ChannelSession, country: GoogleTargetCountry): Promise<string> {
    return this.dataSources.create(session, country);
  }

  publish(session: ChannelSession, draft: ListingDraft): Promise<PublishedListing> {
    return this.publisher.publish(session, draft);
  }

  update(
    session: ChannelSession,
    externalId: string,
    draft: ListingDraft,
  ): Promise<PublishedListing> {
    return this.publisher.update(session, externalId, draft);
  }

  delist(session: ChannelSession, externalId: string, reference?: ListingReference): Promise<void> {
    return this.publisher.delist(session, externalId, reference);
  }

  updatePrices(session: ChannelSession, updates: readonly PriceUpdate[]): Promise<void> {
    return this.publisher.updatePrices(session, updates);
  }
}
