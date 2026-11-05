import { Injectable } from '@nestjs/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import type { HttpResponse } from '../../sdk/http/http-transport.js';
import { type EbayAccountContext, ebayAccountContext } from '../api/ebay-account-context.js';
import { EbayApiClient } from '../api/ebay-api.client.js';
import { ebayErrorDetails } from '../api/ebay-api-error.js';
import {
  EBAY_DUPLICATE_POLICY_ERROR_IDS,
  EBAY_DUPLICATE_POLICY_ID_PARAM,
  EBAY_DUPLICATE_POLICY_NAME_PARAM,
} from '../ebay.constants.js';
import { EbayApp } from '../ebay-app.js';
import { ebayError } from '../ebay-errors.js';
import { EbayBusinessPoliciesOptIn } from './ebay-business-policies.opt-in.js';
import { NO_BUSINESS_POLICIES, type EbayPolicy } from './ebay-business-policies.js';
import { EbayBusinessPoliciesReader } from './ebay-business-policies.reader.js';
import {
  EBAY_DEFAULT_POLICY_SPECS,
  EBAY_DEFAULT_SHIPPING_SERVICES,
  type EbayDefaultPoliciesRequest,
  type EbayDefaultPolicyIds,
  type EbayDefaultPolicySpec,
  type EbayPolicyKind,
  type EbayPolicyTerms,
} from './ebay-default-policies.js';

/** The parameters that tell eBay's "policy already exists" from any other invalid request. */
const DUPLICATE_PARAMS: ReadonlySet<string> = new Set([
  EBAY_DUPLICATE_POLICY_ID_PARAM,
  EBAY_DUPLICATE_POLICY_NAME_PARAM,
]);

/** A created policy's id; null when it existed already and eBay did not say which it is. */
type CreatedPolicyIds = Record<EbayPolicyKind, string | null>;

function noShippingServiceMessage(siteLabel: string): string {
  return (
    `Crossmart has no standard shipping service for ${siteLabel}. ` +
    'Create a shipping policy on eBay, then refresh the policies.'
  );
}

function unlistedPolicyMessage(name: string): string {
  return `eBay says the policy “${name}” exists but does not list it yet. Refresh the policies in a minute.`;
}

/**
 * Creates the default business policies on the seller's account (Account API): free standard
 * shipping, immediate payment and 30-day returns. A policy eBay says exists already is used
 * instead, so creating them twice is harmless. Accounts not opted in are opted in first.
 * Opting in on its own goes through here too: this is what Crossmart writes to the policies.
 */
@Injectable()
export class EbayBusinessPoliciesWriter {
  constructor(
    private readonly app: EbayApp,
    private readonly api: EbayApiClient,
    private readonly reader: EbayBusinessPoliciesReader,
    private readonly optIn: EbayBusinessPoliciesOptIn,
  ) {}

  /** Opts the seller in to business policies; eBay may take a while to enable them. */
  optInToPolicies(session: ChannelSession): Promise<void> {
    return this.optIn.optIn(session);
  }

  /** Creates (or finds) one policy of each kind; answers their ids. */
  async createDefaults(
    session: ChannelSession,
    request: EbayDefaultPoliciesRequest,
  ): Promise<EbayDefaultPolicyIds> {
    const context = await ebayAccountContext(session);
    const terms = this.terms(context, request.currencyCode);
    if (!request.businessPoliciesEnabled) {
      await this.optIn.optIn(session);
    }
    const create = (spec: EbayDefaultPolicySpec): Promise<string | null> =>
      this.create(spec, terms, context.accessToken);
    const created: CreatedPolicyIds = {
      fulfillment: await create(EBAY_DEFAULT_POLICY_SPECS.fulfillment),
      payment: await create(EBAY_DEFAULT_POLICY_SPECS.payment),
      return: await create(EBAY_DEFAULT_POLICY_SPECS.return),
    };
    return this.resolve(created, context);
  }

  /** The policy terms on the connection's marketplace; refused where it has no default service. */
  private terms(context: EbayAccountContext, currencyCode: string): EbayPolicyTerms {
    const shippingServiceCode = EBAY_DEFAULT_SHIPPING_SERVICES[context.marketplaceId];
    if (!shippingServiceCode) {
      throw ebayError(
        ChannelErrorCode.RequestRejected,
        noShippingServiceMessage(context.marketplace.siteLabel),
      );
    }
    return { marketplaceId: context.marketplaceId, currencyCode, shippingServiceCode };
  }

  private async create(
    spec: EbayDefaultPolicySpec,
    terms: EbayPolicyTerms,
    accessToken: string,
  ): Promise<string | null> {
    const response = await this.api.request({
      method: HttpMethod.Post,
      url: new URL(spec.path, this.app.hosts().api),
      accessToken,
      body: spec.body(terms),
    });
    const duplicate = this.duplicateOf(response);
    return duplicate ? duplicate.id : this.api.parse(response, spec.createdId);
  }

  /** The existing policy a "policy already exists" answer names, or null for other answers. */
  private duplicateOf(response: HttpResponse): { id: string | null } | null {
    const error = ebayErrorDetails(response).find(
      ({ errorId, parameters }) =>
        EBAY_DUPLICATE_POLICY_ERROR_IDS.has(errorId) &&
        (parameters ?? []).some(({ name }) => DUPLICATE_PARAMS.has(name)),
    );
    if (!error) return null;
    const id = error.parameters?.find(({ name }) => name === EBAY_DUPLICATE_POLICY_ID_PARAM);
    return { id: id?.value || null };
  }

  /** Finds, by name, the existing policies eBay did not name an id for. */
  private async resolve(
    created: CreatedPolicyIds,
    context: EbayAccountContext,
  ): Promise<EbayDefaultPolicyIds> {
    const { fulfillment, payment, return: returns } = created;
    if (fulfillment && payment && returns) {
      return { fulfillment, payment, return: returns };
    }
    const policies =
      (await this.reader.read(context.accessToken, context.marketplaceId)) ?? NO_BUSINESS_POLICIES;
    const find = (kind: EbayPolicyKind): string =>
      created[kind] ?? this.idByName(policies[kind], EBAY_DEFAULT_POLICY_SPECS[kind].name);
    return { fulfillment: find('fulfillment'), payment: find('payment'), return: find('return') };
  }

  private idByName(policies: readonly EbayPolicy[], name: string): string {
    const match = policies.find((policy) => policy.name === name);
    if (!match) {
      throw ebayError(ChannelErrorCode.RequestRejected, unlistedPolicyMessage(name));
    }
    return match.id;
  }
}
