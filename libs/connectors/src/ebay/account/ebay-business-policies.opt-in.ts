import { Injectable } from '@nestjs/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { HTTP_STATUS_CONFLICT } from '../../sdk/http/http.constants.js';
import { ebayAccountContext } from '../api/ebay-account-context.js';
import { EbayApiClient } from '../api/ebay-api.client.js';
import { ebayErrorIds } from '../api/ebay-api-error.js';
import {
  EBAY_ALREADY_OPTED_IN_ERROR_IDS,
  EBAY_OPT_IN_PATH,
  EBAY_SELLING_POLICY_PROGRAM,
} from '../ebay.constants.js';
import { EbayApp } from '../ebay-app.js';

/**
 * Opts the seller in to business policies (Account API), which listing through the Inventory
 * API needs. eBay may take a while to enable them; an account already opted in is fine.
 */
@Injectable()
export class EbayBusinessPoliciesOptIn {
  constructor(
    private readonly app: EbayApp,
    private readonly api: EbayApiClient,
  ) {}

  async optIn(session: ChannelSession): Promise<void> {
    const { accessToken } = await ebayAccountContext(session);
    const response = await this.api.request({
      method: HttpMethod.Post,
      url: new URL(EBAY_OPT_IN_PATH, this.app.hosts().api),
      accessToken,
      body: { programType: EBAY_SELLING_POLICY_PROGRAM },
    });
    const alreadyIn =
      response.status === HTTP_STATUS_CONFLICT ||
      ebayErrorIds(response).some((errorId) => EBAY_ALREADY_OPTED_IN_ERROR_IDS.has(errorId));
    if (!alreadyIn) {
      this.api.assertSuccess(response);
    }
  }
}
