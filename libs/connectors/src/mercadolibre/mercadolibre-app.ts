import type { OAuthAppCredentials } from '@crossmart/common';
import { ChannelErrorCode } from '../sdk/errors/channel-error-code.enum.js';
import { mercadoLibreError } from './mercadolibre-errors.js';

const NOT_CONFIGURED = 'Mercado Libre is not configured on this Crossmart instance';

/**
 * The Crossmart Mercado Libre app this instance uses: its App ID (the OAuth client id) and
 * Secret Key, which is never logged. Without both, Mercado Libre cannot be connected.
 */
export class MercadoLibreApp {
  constructor(private readonly app: OAuthAppCredentials | null) {}

  get isConfigured(): boolean {
    return this.app !== null;
  }

  settings(): OAuthAppCredentials {
    if (!this.app) {
      throw mercadoLibreError(ChannelErrorCode.ChannelUnavailable, NOT_CONFIGURED);
    }
    return this.app;
  }

  /** The App ID, which notifications carry as `application_id`; null without an app. */
  get appId(): string | null {
    return this.app?.clientId ?? null;
  }
}
