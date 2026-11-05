import type { OAuthAppCredentials } from '@crossmart/common';
import { ChannelErrorCode } from '../sdk/errors/channel-error-code.enum.js';
import { googleMerchantError } from './google-merchant-errors.js';

const NOT_CONFIGURED = 'Google Merchant Center is not configured on this Crossmart instance';

/** The Crossmart Google Cloud OAuth client this instance uses. The secret is never logged. */
export class GoogleMerchantApp {
  constructor(private readonly app: OAuthAppCredentials | null) {}

  get isConfigured(): boolean {
    return this.app !== null;
  }

  settings(): OAuthAppCredentials {
    if (!this.app) {
      throw googleMerchantError(ChannelErrorCode.ChannelUnavailable, NOT_CONFIGURED);
    }
    return this.app;
  }
}
