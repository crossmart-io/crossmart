import type { OAuthAppCredentials } from '@crossmart/common';
import { ChannelErrorCode } from '../sdk/errors/channel-error-code.enum.js';
import { ETSY_API_KEY_SEPARATOR } from './etsy.constants.js';
import { etsyError } from './etsy-errors.js';

const NOT_CONFIGURED = 'Etsy is not configured on this Crossmart instance';

/**
 * The Crossmart Etsy app this instance uses: its keystring (the OAuth client id) and shared
 * secret. Neither is ever logged. Without both, Etsy cannot be connected.
 */
export class EtsyApp {
  constructor(private readonly app: OAuthAppCredentials | null) {}

  get isConfigured(): boolean {
    return this.app !== null;
  }

  settings(): OAuthAppCredentials {
    if (!this.app) {
      throw etsyError(ChannelErrorCode.ChannelUnavailable, NOT_CONFIGURED);
    }
    return this.app;
  }

  /** The `x-api-key` value every call carries: `{keystring}:{shared secret}`. */
  apiKey(): string {
    const { clientId, clientSecret } = this.settings();
    return `${clientId}${ETSY_API_KEY_SEPARATOR}${clientSecret}`;
  }
}
