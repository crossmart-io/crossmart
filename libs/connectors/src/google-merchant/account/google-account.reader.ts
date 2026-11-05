import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { ChannelError } from '../../sdk/errors/channel-error.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { GoogleMerchantApiClient } from '../api/google-merchant-api.client.js';
import {
  ACCOUNTS_API_PATH,
  BUSINESS_INFO_SUFFIX,
  HOMEPAGE_SUFFIX,
} from '../google-merchant.constants.js';

const accountSchema = z.object({
  accountId: z.string().min(1),
  accountName: z.string().min(1),
  languageCode: z.string().optional(),
});

const homepageSchema = z.object({
  uri: z.string().optional(),
  claimed: z.boolean().optional(),
});

const businessInfoSchema = z.object({
  address: z.object({ regionCode: z.string().optional() }).optional(),
});

/** What Crossmart reads about a Merchant Center account on connect. */
export interface GoogleAccountProfile {
  accountId: string;
  accountName: string;
  homepageUri: string | null;
  homepageClaimed: boolean;
  /** The business country, when the account set one. */
  regionCode: string | null;
}

/**
 * Reads a Merchant Center account through the Accounts API: its name, the website it claimed
 * and its business country. The account itself must answer; the rest may be unset.
 */
@Injectable()
export class GoogleAccountReader {
  constructor(private readonly api: GoogleMerchantApiClient) {}

  async read(accessToken: string, accountId: string): Promise<GoogleAccountProfile> {
    const account = await this.get(accessToken, accountId, '', accountSchema);
    const [homepage, businessInfo] = await Promise.all([
      this.optional(this.get(accessToken, accountId, HOMEPAGE_SUFFIX, homepageSchema)),
      this.optional(this.get(accessToken, accountId, BUSINESS_INFO_SUFFIX, businessInfoSchema)),
    ]);
    return {
      accountId: account.accountId,
      accountName: account.accountName,
      homepageUri: homepage?.uri ?? null,
      homepageClaimed: homepage?.claimed ?? false,
      regionCode: businessInfo?.address?.regionCode ?? null,
    };
  }

  private get<TData>(
    accessToken: string,
    accountId: string,
    suffix: string,
    schema: z.ZodType<TData>,
  ): Promise<TData> {
    return this.api.call(
      { method: HttpMethod.Get, path: `${ACCOUNTS_API_PATH}${accountId}${suffix}`, accessToken },
      schema,
    );
  }

  /** Settings the account has not filled in yet answer 404; that is not a failure. */
  private async optional<TData>(reading: Promise<TData>): Promise<TData | null> {
    try {
      return await reading;
    } catch (error) {
      if (error instanceof ChannelError && error.code === ChannelErrorCode.RequestRejected) {
        return null;
      }
      throw error;
    }
  }
}
