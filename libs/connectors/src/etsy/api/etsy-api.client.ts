import { Injectable } from '@nestjs/common';
import type { z } from 'zod';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import type { ChannelErrorMessages } from '../../sdk/errors/channel-error-factory.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { HttpTransport, type HttpResponse } from '../../sdk/http/http-transport.js';
import {
  type JsonApiFailure,
  type JsonApiRequest,
  JsonApiClient,
} from '../../sdk/http/json-api.client.js';
import { ETSY_API_BASE_URL, ETSY_API_KEY_HEADER, type EtsyPathParam } from '../etsy.constants.js';
import { EtsyApp } from '../etsy-app.js';
import { etsyError } from '../etsy-errors.js';
import { etsyErrorCode, etsyErrorMessage } from './etsy-api-error.js';

/** Merchant-readable messages by error code; never the response body or a token. */
const ERROR_MESSAGES: ChannelErrorMessages = {
  [ChannelErrorCode.InvalidAccount]: 'Etsy does not know this shop',
  [ChannelErrorCode.InvalidSignature]: 'Etsy’s reply could not be verified',
  [ChannelErrorCode.AccessDenied]: 'The app was not approved on Etsy',
  [ChannelErrorCode.MissingScopes]: 'Etsy did not grant every permission Crossmart needs',
  [ChannelErrorCode.CredentialsRejected]:
    'Etsy rejected the access token. Connect the Etsy shop again.',
  [ChannelErrorCode.RateLimited]: 'Etsy is rate limiting Crossmart’s requests',
  [ChannelErrorCode.ChannelUnavailable]: 'Etsy is not responding as expected',
  [ChannelErrorCode.RequestRejected]: 'Etsy rejected the request',
};

/** One call to Etsy's Open API v3 on behalf of a shop. */
export interface EtsyRequest extends JsonApiRequest {
  /** A path of `etsy.constants.ts`, with `{shop_id}`-style parameters. */
  path: string;
  params?: Partial<Record<EtsyPathParam, string>>;
  query?: Readonly<Record<string, string>>;
}

/** A path with its parameters filled in, each one URL-encoded. */
export function etsyPath(path: string, params: Partial<Record<EtsyPathParam, string>>): string {
  return Object.entries(params).reduce(
    (filled, [param, value]) => filled.replace(param, encodeURIComponent(value)),
    path,
  );
}

/**
 * Calls Etsy's Open API v3 with a shop's OAuth token and the app's `x-api-key`. A rejected
 * call carries Etsy's own `error` message (never the body or a token), so merchants can fix
 * their listing.
 */
@Injectable()
export class EtsyApiClient extends JsonApiClient<EtsyRequest> {
  constructor(
    http: HttpTransport,
    private readonly app: EtsyApp,
  ) {
    super(http, { error: etsyError, messages: ERROR_MESSAGES });
  }

  /** Reads a path and validates the JSON it answers. */
  get<TData>(request: Omit<EtsyRequest, 'method'>, schema: z.ZodType<TData>): Promise<TData> {
    return this.call({ ...request, method: HttpMethod.Get }, schema);
  }

  protected url(request: EtsyRequest): URL {
    const url = new URL(etsyPath(request.path, request.params ?? {}), ETSY_API_BASE_URL);
    for (const [name, value] of Object.entries(request.query ?? {})) {
      url.searchParams.set(name, value);
    }
    return url;
  }

  protected override headers(request: EtsyRequest): Record<string, string> {
    return { ...super.headers(request), [ETSY_API_KEY_HEADER]: this.app.apiKey() };
  }

  protected describeFailure(response: HttpResponse): JsonApiFailure {
    const code = etsyErrorCode(response.status);
    const detail = code === ChannelErrorCode.RequestRejected ? etsyErrorMessage(response) : null;
    return { code, detail };
  }
}
