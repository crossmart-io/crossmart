import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import type {
  SellerCredentialValues,
  VerifiedSellerAccount,
} from '../../sdk/auth/seller-credentials.js';
import type { ChannelAccountProfile } from '../../sdk/channel-settings.js';
import { ChannelType } from '../../sdk/channel-type.enum.js';
import type { FalabellaAccount } from '../api/falabella-account.js';
import { FalabellaApiClient } from '../api/falabella-api.client.js';
import { FalabellaAction } from '../falabella.enums.js';
import { falabellaCountry } from '../falabella-countries.js';
import type { FalabellaSettings } from '../falabella-settings.js';
import { falabellaAccountId, falabellaAccountOf } from './falabella-credentials.js';

/**
 * Checks a Seller Center user's key with the cheapest signed call there is, `FeedCount`: a
 * wrong key fails the signature (`E007`), a user without API access is denied (`E009`).
 */
@Injectable()
export class FalabellaAccountVerifier {
  constructor(private readonly api: FalabellaApiClient) {}

  async verify(values: SellerCredentialValues): Promise<VerifiedSellerAccount> {
    const account = falabellaAccountOf(values);
    const profile = await this.describe(account);
    return {
      externalAccountId: falabellaAccountId(account),
      credentials: { accessToken: account.apiKey },
      grantedScopes: [],
      profile,
    };
  }

  /** Calls Falabella with the account's key, then names the account from what it holds. */
  async describe(account: FalabellaAccount): Promise<ChannelAccountProfile<FalabellaSettings>> {
    await this.api.call(account, { action: FalabellaAction.FeedCount }, z.unknown());
    const { name, currencyCode } = falabellaCountry(account.country);
    const { sellerId, userId, country } = account;
    return {
      displayName: `${sellerId} (${name})`,
      settings: { channel: ChannelType.Falabella, country, sellerId, userId, currencyCode },
    };
  }
}
