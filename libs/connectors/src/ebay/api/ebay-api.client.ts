import { Injectable } from '@nestjs/common';
import type { z } from 'zod';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import type { ChannelErrorMessages } from '../../sdk/errors/channel-error-factory.js';
import {
  type JsonApiFailure,
  type JsonApiRequest,
  JsonApiClient,
} from '../../sdk/http/json-api.client.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { HttpTransport, type HttpResponse } from '../../sdk/http/http-transport.js';
import {
  ACCEPT_LANGUAGE_HEADER,
  CONTENT_LANGUAGE_HEADER,
  EBAY_DEFAULT_LANGUAGE,
} from '../ebay.constants.js';
import { ebayError } from '../ebay-errors.js';
import { ebayErrorCode, ebayRejectionMessage } from './ebay-api-error.js';

/** Merchant-readable messages by error code; never the response body or the token. */
const ERROR_MESSAGES: ChannelErrorMessages = {
  [ChannelErrorCode.InvalidAccount]: 'eBay does not know this account',
  [ChannelErrorCode.InvalidSignature]: 'eBay’s reply could not be verified',
  [ChannelErrorCode.AccessDenied]: 'The app was not approved on eBay',
  [ChannelErrorCode.MissingScopes]: 'eBay did not grant every permission Crossmart needs',
  [ChannelErrorCode.CredentialsRejected]:
    'eBay rejected the access token. Connect the eBay account again.',
  [ChannelErrorCode.RateLimited]: 'eBay is rate limiting requests to this account',
  [ChannelErrorCode.ChannelUnavailable]: 'eBay is not responding as expected',
  [ChannelErrorCode.RequestRejected]: 'eBay rejected the request',
};

/** One call to an eBay REST API on behalf of a user. */
export interface EbayRequest extends JsonApiRequest {
  url: URL;
  /** The listing language the Inventory API needs on item and offer writes. */
  contentLanguage?: string;
}

/**
 * Calls eBay's REST APIs with a user access token. A rejected request carries eBay's own
 * messages (never the body or the token), so merchants can fix their listing.
 */
@Injectable()
export class EbayApiClient extends JsonApiClient<EbayRequest> {
  constructor(http: HttpTransport) {
    super(http, { error: ebayError, messages: ERROR_MESSAGES });
  }

  /** Reads `url` and validates the JSON it answers. */
  async get<TData>(url: URL, accessToken: string, schema: z.ZodType<TData>): Promise<TData> {
    return this.parse(await this.send(url, accessToken), schema);
  }

  /** The raw response of a read, for callers that handle some eBay errors themselves. */
  send(url: URL, accessToken: string): Promise<HttpResponse> {
    return this.request({ method: HttpMethod.Get, url, accessToken });
  }

  protected url(request: EbayRequest): URL {
    return request.url;
  }

  /** Always names a language: Node's default `Accept-Language: *` fails on the Inventory API. */
  protected override headers(request: EbayRequest): Record<string, string> {
    return {
      ...super.headers(request),
      [ACCEPT_LANGUAGE_HEADER]: request.contentLanguage ?? EBAY_DEFAULT_LANGUAGE,
      ...(request.contentLanguage ? { [CONTENT_LANGUAGE_HEADER]: request.contentLanguage } : {}),
    };
  }

  protected describeFailure(response: HttpResponse): JsonApiFailure {
    const code = ebayErrorCode(response.status);
    const detail =
      code === ChannelErrorCode.RequestRejected ? ebayRejectionMessage(response) : null;
    return { code, detail };
  }
}
