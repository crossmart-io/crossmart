import { Injectable } from '@nestjs/common';
import type { z } from 'zod';
import type { ChannelError } from '../../sdk/errors/channel-error.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import {
  ACCEPT_HEADER,
  AUTHORIZATION_HEADER,
  JSON_CONTENT_TYPE,
} from '../../sdk/http/http.constants.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { isSuccessStatus } from '../../sdk/http/http-status.js';
import { HttpTransport, type HttpResponse } from '../../sdk/http/http-transport.js';
import { parseJsonBody } from '../../sdk/http/parse-json.js';
import { BEARER_AUTH_SCHEME } from '../ebay.constants.js';
import { ebayError } from '../ebay-errors.js';
import { ebayErrorCode } from './ebay-api-error.js';

/** Merchant-readable messages by error code; never the response body or the token. */
const ERROR_MESSAGES: Readonly<Record<ChannelErrorCode, string>> = {
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

/**
 * Calls eBay's REST APIs with a user access token and validates each response against a
 * schema. Failures become `ChannelError`s that name a cause and never carry the body.
 */
@Injectable()
export class EbayApiClient {
  constructor(private readonly http: HttpTransport) {}

  /** Reads `url` and validates the JSON it answers. */
  async get<TData>(url: URL, accessToken: string, schema: z.ZodType<TData>): Promise<TData> {
    return this.parse(await this.send(url, accessToken), schema);
  }

  /** The raw response, for callers that handle some eBay errors themselves. */
  async send(url: URL, accessToken: string): Promise<HttpResponse> {
    try {
      return await this.http.send({
        method: HttpMethod.Get,
        url: url.toString(),
        headers: {
          [AUTHORIZATION_HEADER]: `${BEARER_AUTH_SCHEME} ${accessToken}`,
          [ACCEPT_HEADER]: JSON_CONTENT_TYPE,
        },
      });
    } catch {
      throw this.error(ChannelErrorCode.ChannelUnavailable);
    }
  }

  parse<TData>(response: HttpResponse, schema: z.ZodType<TData>): TData {
    if (!isSuccessStatus(response.status)) {
      throw this.error(ebayErrorCode(response.status));
    }
    const parsed = schema.safeParse(parseJsonBody(response.body));
    if (!parsed.success) {
      throw this.error(ChannelErrorCode.ChannelUnavailable);
    }
    return parsed.data;
  }

  private error(code: ChannelErrorCode): ChannelError {
    return ebayError(code, ERROR_MESSAGES[code]);
  }
}
