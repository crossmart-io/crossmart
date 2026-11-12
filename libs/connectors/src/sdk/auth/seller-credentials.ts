import type { ChannelAccountProfile } from '../channel-settings.js';
import type { ChannelAuthorization } from './oauth-authorization.js';

/**
 * A field the merchant fills to connect a channel with keys it issued them (Falabella, Mirakl).
 * Core checks the values against these before the connector sees them.
 */
export interface SellerCredentialField {
  key: string;
  /** A secret (an API key): sealed with the credentials, never logged, stored or shown again. */
  secret: boolean;
  maxLength: number;
  /** The only values it accepts, for a field picked from a list (a country). */
  options?: readonly string[];
}

/** The merchant's values, by field key, trimmed and checked against the connector's fields. */
export type SellerCredentialValues = Readonly<Record<string, string>>;

/**
 * Credentials the channel accepted: the account they belong to, how to call it, and what
 * Crossmart learned about it (its name and settings), read with the same keys.
 */
export interface VerifiedSellerAccount extends ChannelAuthorization {
  profile: ChannelAccountProfile;
}
