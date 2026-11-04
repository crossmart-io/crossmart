import type { EbayAppSettings } from '@crossmart/common';
import { ChannelErrorCode } from '../sdk/errors/channel-error-code.enum.js';
import { EBAY_HOSTS, type EbayHosts } from './ebay.constants.js';
import { ebayError } from './ebay-errors.js';

const NOT_CONFIGURED = 'eBay is not configured on this Crossmart instance';

/**
 * The Crossmart eBay app this instance uses: its keyset (client id and secret), the RuName of
 * its callback, and the environment the keyset belongs to. The secret is never logged.
 */
export class EbayApp {
  constructor(private readonly app: EbayAppSettings | null) {}

  get isConfigured(): boolean {
    return this.app !== null;
  }

  settings(): EbayAppSettings {
    if (!this.app) {
      throw ebayError(ChannelErrorCode.ChannelUnavailable, NOT_CONFIGURED);
    }
    return this.app;
  }

  /** The sign-in and API hosts of the app's environment. */
  hosts(): EbayHosts {
    return EBAY_HOSTS[this.settings().environment];
  }
}
