import { Injectable } from '@nestjs/common';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import type { ChannelErrorMessages } from '../../sdk/errors/channel-error-factory.js';
import {
  type JsonApiFailure,
  type JsonApiRequest,
  JsonApiClient,
} from '../../sdk/http/json-api.client.js';
import { HttpTransport, type HttpResponse } from '../../sdk/http/http-transport.js';
import { MERCHANT_API_URL } from '../google-merchant.constants.js';
import { googleMerchantError } from '../google-merchant-errors.js';
import { googleApiError, googleErrorCode, isUnregisteredProject } from './google-api-error.js';

/** Merchant-readable messages by error code; never the response body or the token. */
const ERROR_MESSAGES: ChannelErrorMessages = {
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

/** One call to the Merchant API on behalf of a user. Paths start with the sub-API, `/products/v1/...`. */
export interface GoogleApiRequest extends JsonApiRequest {
  path: string;
  query?: Readonly<Record<string, string>>;
}

/**
 * Calls the Merchant API with a user's access token. A rejected request carries Google's own
 * message (never the body or the token), so merchants can fix their data; an unregistered
 * Cloud project names the fix only Crossmart's operator can make.
 */
@Injectable()
export class GoogleMerchantApiClient extends JsonApiClient<GoogleApiRequest> {
  constructor(http: HttpTransport) {
    super(http, { error: googleMerchantError, messages: ERROR_MESSAGES });
  }

  protected url(request: GoogleApiRequest): URL {
    const url = new URL(request.path, MERCHANT_API_URL);
    for (const [name, value] of Object.entries(request.query ?? {})) {
      url.searchParams.set(name, value);
    }
    return url;
  }

  /** Reads Google's `google.rpc.Status` error body. */
  protected describeFailure(response: HttpResponse): JsonApiFailure {
    const error = googleApiError(response);
    const code = googleErrorCode(response.status, error);
    if (isUnregisteredProject(error)) {
      return { code, message: NOT_REGISTERED };
    }
    return { code, detail: code === ChannelErrorCode.RequestRejected ? error.message : null };
  }
}
