import type { OAuthAppCredentials } from '@crossmart/common';
import { ChannelType } from '../sdk/channel-type.enum.js';
import { ChannelError } from '../sdk/errors/channel-error.js';
import { ChannelErrorCode } from '../sdk/errors/channel-error-code.enum.js';

const NOT_CONFIGURED = 'Shopify is not configured on this Crossmart instance';

/**
 * The Crossmart Shopify app this instance uses (client id and secret from the Dev Dashboard).
 * The secret signs callbacks and webhooks; it is never logged.
 */
export class ShopifyApp {
  constructor(private readonly app: OAuthAppCredentials | null) {}

  get isConfigured(): boolean {
    return this.app !== null;
  }

  credentials(): OAuthAppCredentials {
    if (!this.app) {
      throw new ChannelError(
        ChannelType.Shopify,
        ChannelErrorCode.ChannelUnavailable,
        NOT_CONFIGURED,
      );
    }
    return this.app;
  }
}
