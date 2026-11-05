import { Injectable } from '@nestjs/common';
import type { z } from 'zod';
import type { ChannelError } from '../../sdk/errors/channel-error.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import {
  ACCEPT_HEADER,
  AUTHORIZATION_HEADER,
  CONTENT_TYPE_HEADER,
  JSON_CONTENT_TYPE,
} from '../../sdk/http/http.constants.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { isSuccessStatus } from '../../sdk/http/http-status.js';
import { HttpTransport, type HttpResponse } from '../../sdk/http/http-transport.js';
import { parseJsonBody } from '../../sdk/http/parse-json.js';
import {
  ACCEPT_LANGUAGE_HEADER,
  BEARER_AUTH_SCHEME,
  CONTENT_LANGUAGE_HEADER,
  EBAY_DEFAULT_LANGUAGE,
} from '../ebay.constants.js';
import { ebayError } from '../ebay-errors.js';
import { ebayErrorCode, ebayRejectionMessage } from './ebay-api-error.js';

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

const REJECTION_SEPARATOR = ': ';

/** One call to an eBay REST API on behalf of a user. */
export interface EbayRequest {
  method: HttpMethod;
  url: URL;
  accessToken: string;
  /** Sent as JSON. */
  body?: unknown;
  /** The listing language the Inventory API needs on item and offer writes. */
  contentLanguage?: string;
}

/**
 * Calls eBay's REST APIs with a user access token and validates each response against a
 * schema. Failures become `ChannelError`s that name a cause; a rejected request carries
 * eBay's own messages (never the body or the token), so merchants can fix their listing.
 */
@Injectable()
export class EbayApiClient {
  constructor(private readonly http: HttpTransport) {}

  /** Reads `url` and validates the JSON it answers. */
  async get<TData>(url: URL, accessToken: string, schema: z.ZodType<TData>): Promise<TData> {
    return this.parse(await this.send(url, accessToken), schema);
  }

  /** The raw response of a read, for callers that handle some eBay errors themselves. */
  send(url: URL, accessToken: string): Promise<HttpResponse> {
    return this.request({ method: HttpMethod.Get, url, accessToken });
  }

  /** Sends the request and validates the JSON it answers. */
  async call<TData>(request: EbayRequest, schema: z.ZodType<TData>): Promise<TData> {
    return this.parse(await this.request(request), schema);
  }

  /** Sends a request whose success has no body worth reading (204, or an echo). */
  async execute(request: EbayRequest): Promise<void> {
    this.assertSuccess(await this.request(request));
  }

  /** The raw response, whatever its status. Rejects only when eBay could not be reached. */
  async request(request: EbayRequest): Promise<HttpResponse> {
    try {
      return await this.http.send({
        method: request.method,
        url: request.url.toString(),
        headers: this.headers(request),
        ...(request.body === undefined ? {} : { body: JSON.stringify(request.body) }),
      });
    } catch {
      throw this.error(ChannelErrorCode.ChannelUnavailable);
    }
  }

  parse<TData>(response: HttpResponse, schema: z.ZodType<TData>): TData {
    this.assertSuccess(response);
    const parsed = schema.safeParse(parseJsonBody(response.body));
    if (!parsed.success) {
      throw this.error(ChannelErrorCode.ChannelUnavailable);
    }
    return parsed.data;
  }

  /** Throws the `ChannelError` a failed response means. */
  assertSuccess(response: HttpResponse): void {
    if (isSuccessStatus(response.status)) return;
    const code = ebayErrorCode(response.status);
    const rejection =
      code === ChannelErrorCode.RequestRejected ? ebayRejectionMessage(response) : null;
    throw this.error(code, rejection);
  }

  private headers(request: EbayRequest): Record<string, string> {
    return {
      [AUTHORIZATION_HEADER]: `${BEARER_AUTH_SCHEME} ${request.accessToken}`,
      [ACCEPT_HEADER]: JSON_CONTENT_TYPE,
      [ACCEPT_LANGUAGE_HEADER]: request.contentLanguage ?? EBAY_DEFAULT_LANGUAGE,
      ...(request.body === undefined ? {} : { [CONTENT_TYPE_HEADER]: JSON_CONTENT_TYPE }),
      ...(request.contentLanguage ? { [CONTENT_LANGUAGE_HEADER]: request.contentLanguage } : {}),
    };
  }

  private error(code: ChannelErrorCode, detail: string | null = null): ChannelError {
    const message = ERROR_MESSAGES[code];
    return ebayError(code, detail ? `${message}${REJECTION_SEPARATOR}${detail}` : message);
  }
}
