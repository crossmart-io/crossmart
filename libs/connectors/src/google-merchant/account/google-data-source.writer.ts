import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { GoogleMerchantApiClient } from '../api/google-merchant-api.client.js';
import { type GoogleTargetCountry, GOOGLE_COUNTRY_MARKETS } from '../google-merchant-country.js';
import {
  DATA_SOURCE_DISPLAY_NAME_PREFIX,
  DATA_SOURCES_API_PATH,
  DATA_SOURCES_SUFFIX,
} from '../google-merchant.constants.js';

const dataSourceSchema = z.object({ dataSourceId: z.string().min(1) });

/**
 * Creates the primary API data source Crossmart publishes a country's products into. Its feed
 * label is the country and its language the country's, so each country is its own source.
 */
@Injectable()
export class GoogleDataSourceWriter {
  constructor(private readonly api: GoogleMerchantApiClient) {}

  async create(session: ChannelSession, country: GoogleTargetCountry): Promise<string> {
    const { dataSourceId } = await this.api.call(
      {
        method: HttpMethod.Post,
        path: `${DATA_SOURCES_API_PATH}${session.externalAccountId}${DATA_SOURCES_SUFFIX}`,
        accessToken: await session.accessToken(),
        body: {
          displayName: `${DATA_SOURCE_DISPLAY_NAME_PREFIX} (${country})`,
          primaryProductDataSource: {
            contentLanguage: GOOGLE_COUNTRY_MARKETS[country].contentLanguage,
            feedLabel: country,
            countries: [country],
          },
        },
      },
      dataSourceSchema,
    );
    return dataSourceId;
  }
}
