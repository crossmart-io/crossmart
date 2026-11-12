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
import { HTTP_STATUS_NOT_FOUND } from '../../sdk/http/http.constants.js';
import {
  MERCADOLIBRE_API_BASE_URL,
  type MercadoLibrePathParam,
} from '../mercadolibre.constants.js';
import { mercadoLibreError } from '../mercadolibre-errors.js';
import { mercadoLibreErrorCode, mercadoLibreErrorMessage } from './mercadolibre-api-error.js';

/** Merchant-readable messages by error code; never the response body or a token. */
const ERROR_MESSAGES: ChannelErrorMessages = {
  [ChannelErrorCode.InvalidAccount]: 'Mercado Libre does not know this seller',
  [ChannelErrorCode.InvalidSignature]: 'Mercado Libre’s reply could not be verified',
  [ChannelErrorCode.AccessDenied]: 'The app was not authorized on Mercado Libre',
  [ChannelErrorCode.MissingScopes]: 'Mercado Libre did not grant every permission Crossmart needs',
  [ChannelErrorCode.CredentialsRejected]:
    'Mercado Libre rejected the access token. Connect the Mercado Libre account again.',
  [ChannelErrorCode.RateLimited]: 'Mercado Libre is rate limiting Crossmart’s requests',
  [ChannelErrorCode.ChannelUnavailable]: 'Mercado Libre is not responding as expected',
  [ChannelErrorCode.RequestRejected]: 'Mercado Libre rejected the request',
};

/** One call to Mercado Libre's API on behalf of a seller. */
export interface MercadoLibreRequest extends JsonApiRequest {
  /** A path of `mercadolibre.constants.ts`, with `{item_id}`-style parameters. */
  path: string;
  params?: Partial<Record<MercadoLibrePathParam, string>>;
  query?: Readonly<Record<string, string>>;
}

/** A path with its parameters filled in, each one URL-encoded. */
export function mercadoLibrePath(
  path: string,
  params: Partial<Record<MercadoLibrePathParam, string>>,
): string {
  return Object.entries(params).reduce(
    (filled, [param, value]) => filled.replace(param, encodeURIComponent(value)),
    path,
  );
}

/**
 * Calls Mercado Libre's API with a seller's token, always in the `Authorization` header (the
 * guides forbid it in the query). A rejected call carries Mercado Libre's own cause messages
 * (never the body or a token), so merchants can fix their listing.
 */
@Injectable()
export class MercadoLibreApiClient extends JsonApiClient<MercadoLibreRequest> {
  constructor(http: HttpTransport) {
    super(http, { error: mercadoLibreError, messages: ERROR_MESSAGES });
  }

  /** Reads a path and validates the JSON it answers. */
  get<TData>(
    request: Omit<MercadoLibreRequest, 'method'>,
    schema: z.ZodType<TData>,
  ): Promise<TData> {
    return this.call({ ...request, method: HttpMethod.Get }, schema);
  }

  /** Reads a path, or answers null when Mercado Libre has nothing there (404). */
  async find<TData>(
    request: Omit<MercadoLibreRequest, 'method'>,
    schema: z.ZodType<TData>,
  ): Promise<TData | null> {
    const response = await this.request({ ...request, method: HttpMethod.Get });
    return response.status === HTTP_STATUS_NOT_FOUND ? null : this.parse(response, schema);
  }

  protected url(request: MercadoLibreRequest): URL {
    const path = mercadoLibrePath(request.path, request.params ?? {});
    const url = new URL(path, MERCADOLIBRE_API_BASE_URL);
    for (const [name, value] of Object.entries(request.query ?? {})) {
      url.searchParams.set(name, value);
    }
    return url;
  }

  protected describeFailure(response: HttpResponse): JsonApiFailure {
    const code = mercadoLibreErrorCode(response.status);
    const detail =
      code === ChannelErrorCode.RequestRejected ? mercadoLibreErrorMessage(response) : null;
    return { code, detail };
  }
}
