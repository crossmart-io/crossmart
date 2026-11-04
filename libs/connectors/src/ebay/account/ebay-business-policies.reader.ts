import { Injectable } from '@nestjs/common';
import type { z } from 'zod';
import { EbayApiClient } from '../api/ebay-api.client.js';
import { ebayErrorIds } from '../api/ebay-api-error.js';
import {
  EBAY_BUSINESS_POLICY_UNAVAILABLE_ERROR_IDS,
  EBAY_FULFILLMENT_POLICY_PATH,
  EBAY_MARKETPLACE_ID_PARAM,
  EBAY_PAYMENT_POLICY_PATH,
  EBAY_RETURN_POLICY_PATH,
} from '../ebay.constants.js';
import { EbayApp } from '../ebay-app.js';
import type { EbayMarketplaceId } from '../ebay-marketplace.js';
import {
  EBAY_POLICY_RESPONSES,
  type EbayBusinessPolicies,
  type EbayPolicy,
} from './ebay-business-policies.js';

/** A policy list, or null when the account is not opted in to business policies. */
type PolicyList = EbayPolicy[] | null;

/**
 * Reads the seller's fulfillment, payment and return policies on a marketplace (Account API).
 * An account without business policies is reported as such, never as a failure.
 */
@Injectable()
export class EbayBusinessPoliciesReader {
  constructor(
    private readonly app: EbayApp,
    private readonly api: EbayApiClient,
  ) {}

  /** The policies, or null when the account has not opted in to business policies. */
  async read(
    accessToken: string,
    marketplaceId: EbayMarketplaceId,
  ): Promise<EbayBusinessPolicies | null> {
    const read = (path: string, schema: z.ZodType<EbayPolicy[]>): Promise<PolicyList> =>
      this.readList(this.policyUrl(path, marketplaceId), accessToken, schema);
    const [fulfillment, payment, returns] = await Promise.all([
      read(EBAY_FULFILLMENT_POLICY_PATH, EBAY_POLICY_RESPONSES.fulfillment),
      read(EBAY_PAYMENT_POLICY_PATH, EBAY_POLICY_RESPONSES.payment),
      read(EBAY_RETURN_POLICY_PATH, EBAY_POLICY_RESPONSES.return),
    ]);
    if (!fulfillment || !payment || !returns) {
      return null;
    }
    return { fulfillment, payment, return: returns };
  }

  private async readList(
    url: URL,
    accessToken: string,
    schema: z.ZodType<EbayPolicy[]>,
  ): Promise<PolicyList> {
    const response = await this.api.send(url, accessToken);
    const errorIds = ebayErrorIds(response);
    if (errorIds.some((errorId) => EBAY_BUSINESS_POLICY_UNAVAILABLE_ERROR_IDS.has(errorId))) {
      return null;
    }
    return this.api.parse(response, schema);
  }

  private policyUrl(path: string, marketplaceId: EbayMarketplaceId): URL {
    const url = new URL(path, this.app.hosts().api);
    url.searchParams.set(EBAY_MARKETPLACE_ID_PARAM, marketplaceId);
    return url;
  }
}
