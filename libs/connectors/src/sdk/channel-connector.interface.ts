import type { ChannelAuthStrategy } from './channel-auth-strategy.enum.js';
import type { ChannelCapability } from './channel-capability.enum.js';
import type { OptionalScope } from './channel-feature.enum.js';
import type { ChannelAccountProfile, ChannelSettings } from './channel-settings.js';
import type { ChannelType } from './channel-type.enum.js';
import type { ChannelCredentials } from './auth/channel-credentials.js';
import type { ChannelSession } from './auth/channel-session.js';
import type {
  SellerCredentialField,
  SellerCredentialValues,
  VerifiedSellerAccount,
} from './auth/seller-credentials.js';
import type {
  ChannelAuthorization,
  OAuthAuthorizeRequest,
  OAuthCallback,
} from './auth/oauth-authorization.js';
import type { ChannelContentLimits } from './content/channel-content-limits.js';
import type { RateLimitBucket } from './rate-limit-bucket.js';

/**
 * Base contract every marketplace connector implements. Capability-specific behaviour
 * (publishing, inventory, orders...) comes from the interfaces in `capabilities/`, which a
 * connector implements only for what its channel supports, and declares in `capabilities`.
 */
export interface ChannelConnector {
  readonly channel: ChannelType;
  readonly displayName: string;
  readonly authStrategy: ChannelAuthStrategy;
  readonly capabilities: ReadonlySet<ChannelCapability>;
  readonly rateLimits: readonly RateLimitBucket[];
  /** Scopes the connector needs; a connection granted fewer cannot be completed. */
  readonly requiredScopes: readonly string[];
  /** Scopes the connector asks for too, and what a connection without each cannot do. */
  readonly optionalScopes?: readonly OptionalScope[];
  /** What listings on the channel take; channels without them get no generated content. */
  readonly contentLimits?: ChannelContentLimits;

  /** Whether this instance has what the connector needs (app credentials, for OAuth apps). */
  isConfigured(): boolean;

  /** Reads the account's name and settings, on connect and when they are refreshed. */
  describeAccount(session: ChannelSession): Promise<ChannelAccountProfile>;

  /** Validates settings read back from storage. Throws when they do not match the schema. */
  parseSettings(raw: unknown): ChannelSettings;
}

/** The merchant authorizes Crossmart's app on the channel (Shopify, eBay, Etsy). */
export interface OAuthAppConnector extends ChannelConnector {
  readonly authStrategy: ChannelAuthStrategy.OAuthApp;

  /**
   * What the merchant typed or picked, normalized (a shop domain, an eBay marketplace), or null
   * when it is not valid. It travels in the signed state and comes back on the callback.
   */
  normalizeAccountHandle(accountHandle: string): string | null;

  authorizationUrl(request: OAuthAuthorizeRequest): URL;

  /**
   * Verifies the callback (signature, and that it answers for `callback.accountHandle`) and
   * exchanges its code for credentials. Throws `InvalidAccount` for another account.
   */
  completeAuthorization(callback: OAuthCallback): Promise<ChannelAuthorization>;

  /** Exchanges a refresh token for new credentials. Throws `CredentialsRejected` when expired. */
  refreshCredentials(
    externalAccountId: string,
    credentials: ChannelCredentials,
  ): Promise<ChannelCredentials>;

  /** Revokes Crossmart's access on the channel, where the channel supports it. */
  revokeAccess(session: ChannelSession): Promise<void>;
}

/** The merchant pastes keys the channel issued them (Falabella, Mirakl, Walmart). */
export interface SellerCredentialsConnector extends ChannelConnector {
  readonly authStrategy: ChannelAuthStrategy.SellerCredentials;

  /** What the merchant pastes, in the order a form shows it. At least one field is secret. */
  readonly credentialFields: readonly SellerCredentialField[];

  /**
   * Checks the keys with a live call and returns the account they belong to. Throws
   * `CredentialsRejected` when the channel refuses them. The keys never appear in errors.
   */
  verifyCredentials(values: SellerCredentialValues): Promise<VerifiedSellerAccount>;
}
