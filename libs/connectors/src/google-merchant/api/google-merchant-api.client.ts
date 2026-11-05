import { Injectable } from '@nestjs/common';
import type { z } from 'zod';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import type { ChannelError } from '../../sdk/errors/channel-error.js';
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
import { BEARER_AUTH_SCHEME, MERCHANT_API_URL } from '../google-merchant.constants.js';
import { googleMerchantError } from '../google-merchant-errors.js';
import {
  type GoogleApiError,
  googleApiError,
  googleErrorCode,
  isUnregisteredProject,
} from './google-api-error.js';

/** Merchant-readable messages by error code; never the response body or the token. */
const ERROR_MESSAGES: Readonly<Record<ChannelErrorCode, string>> = {
  [ChannelErrorCode.InvalidAccount]:
    'This Google account cannot manage that Merchant Center account. Sign in with a user of the account.',
  [ChannelErrorCode.InvalidSignature]: 'Google’s reply could not be verified',
  [ChannelErrorCode.AccessDenied]: 'The app was not approved on Google',
  [ChannelErrorCode.MissingScopes]: 'Google did not grant access to Merchant Center',
  [ChannelErrorCode.CredentialsRejected]:
    'Google rejected the access token. Connect the Merchant Center account again.',
  [ChannelErrorCode.RateLimited]: 'Google is rate limiting requests to this account',
  [ChannelErrorCode.ChannelUnavailable]: 'Google Merchant Center is not responding as expected',
  [ChannelErrorCode.RequestRejected]: 'Google Merchant Center rejected the request',
};

const NOT_REGISTERED =
  'This Crossmart instance’s Google Cloud project is not registered with the Merchant API yet. Ask its operator to register it.';
const REJECTION_SEPARATOR = ': ';

/** One call to the Merchant API on behalf of a user. Paths start with the sub-API, `/products/v1/...`. */
export interface GoogleApiRequest {
  method: HttpMethod;
  path: string;
  query?: Readonly<Record<string, string>>;
  accessToken: string;
  /** Sent as JSON. */
  body?: unknown;
}

/**
 * Calls the Merchant API with a user's access token and validates each response against a
 * schema. Failures become `ChannelError`s that name a cause; a rejected request carries
 * Google's own message (never the body or the token), so merchants can fix their data.
 */
@Injectable()
export class GoogleMerchantApiClient {
  constructor(private readonly http: HttpTransport) {}

  /** Sends the request and validates the JSON it answers. */
  async call<TData>(request: GoogleApiRequest, schema: z.ZodType<TData>): Promise<TData> {
    const response = await this.request(request);
    this.assertSuccess(response);
    const parsed = schema.safeParse(parseJsonBody(response.body));
    if (!parsed.success) {
      throw googleMerchantError(
        ChannelErrorCode.ChannelUnavailable,
        ERROR_MESSAGES[ChannelErrorCode.ChannelUnavailable],
      );
    }
    return parsed.data;
  }

  /** Sends a request whose success has no body worth reading. */
  async execute(request: GoogleApiRequest): Promise<void> {
    this.assertSuccess(await this.request(request));
  }

  /** The raw response, whatever its status. Rejects only when Google could not be reached. */
  async request(request: GoogleApiRequest): Promise<HttpResponse> {
    try {
      return await this.http.send({
        method: request.method,
        url: this.url(request).toString(),
        headers: this.headers(request),
        ...(request.body === undefined ? {} : { body: JSON.stringify(request.body) }),
      });
    } catch {
      throw this.error(ChannelErrorCode.ChannelUnavailable);
    }
  }

  /** Throws the `ChannelError` a failed response means. */
  assertSuccess(response: HttpResponse): void {
    if (isSuccessStatus(response.status)) return;
    const details = googleApiError(response);
    throw this.error(googleErrorCode(response.status, details), details);
  }

  private url(request: GoogleApiRequest): URL {
    const url = new URL(request.path, MERCHANT_API_URL);
    for (const [name, value] of Object.entries(request.query ?? {})) {
      url.searchParams.set(name, value);
    }
    return url;
  }

  private headers(request: GoogleApiRequest): Record<string, string> {
    return {
      [AUTHORIZATION_HEADER]: `${BEARER_AUTH_SCHEME} ${request.accessToken}`,
      [ACCEPT_HEADER]: JSON_CONTENT_TYPE,
      ...(request.body === undefined ? {} : { [CONTENT_TYPE_HEADER]: JSON_CONTENT_TYPE }),
    };
  }

  private error(code: ChannelErrorCode, details?: GoogleApiError): ChannelError {
    if (details && isUnregisteredProject(details)) {
      return googleMerchantError(code, NOT_REGISTERED);
    }
    const detail = code === ChannelErrorCode.RequestRejected ? details?.message : null;
    const message = ERROR_MESSAGES[code];
    return googleMerchantError(
      code,
      detail ? `${message}${REJECTION_SEPARATOR}${detail}` : message,
    );
  }
}
