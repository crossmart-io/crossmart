import { Injectable } from '@nestjs/common';
import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import { ChannelType } from '../../sdk/channel-type.enum.js';
import { ChannelError } from '../../sdk/errors/channel-error.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import {
  ACCEPT_HEADER,
  CONTENT_TYPE_HEADER,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_TOO_MANY_REQUESTS,
  HTTP_STATUS_UNAUTHORIZED,
  JSON_CONTENT_TYPE,
} from '../../sdk/http/http.constants.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { isServerErrorStatus, isSuccessStatus } from '../../sdk/http/http-status.js';
import { HttpTransport, type HttpResponse } from '../../sdk/http/http-transport.js';
import { parseJsonBody } from '../../sdk/http/parse-json.js';
import { Sleeper } from '../../sdk/time/sleeper.js';
import { shopOrigin } from '../shop-domain.js';
import {
  SHOPIFY_ACCESS_TOKEN_HEADER,
  SHOPIFY_GRAPHQL_PATH,
  SHOPIFY_MAX_ATTEMPTS,
} from '../shopify.constants.js';
import {
  isThrottled,
  type ShopifyGraphqlEnvelope,
  shopifyGraphqlEnvelopeSchema,
} from './shopify-graphql-response.js';
import type { ShopifyOperation } from './shopify-operation.js';
import { backoffDelayMs, retryAfterDelayMs, throttleDelayMs } from './shopify-retry-policy.js';

/** One try: the data, or the error to retry after `delayMs`. Fatal errors are thrown. */
type AttemptOutcome<TData> = { data: TData } | { retry: ChannelError; delayMs: number };

const CREDENTIALS_REJECTED = 'Shopify rejected the access token. Connect the store again.';
const RATE_LIMITED = 'Shopify is rate limiting requests to this store';
const UNAVAILABLE = 'Shopify is not responding as expected';

function channelError(code: ChannelErrorCode, message: string): ChannelError {
  return new ChannelError(ChannelType.Shopify, code, message);
}

/**
 * The typed Admin GraphQL client. It waits out cost-based throttling (`THROTTLED`) using the
 * bucket's restore rate, honours `Retry-After` on 429, backs off on outages, and validates
 * every response against the operation's schema.
 */
@Injectable()
export class ShopifyAdminClient {
  constructor(
    private readonly http: HttpTransport,
    private readonly sleeper: Sleeper,
  ) {}

  async request<TData, TVariables extends object>(
    session: ChannelSession,
    operation: ShopifyOperation<TData, TVariables>,
    variables?: TVariables,
  ): Promise<TData> {
    let lastError = channelError(ChannelErrorCode.ChannelUnavailable, UNAVAILABLE);
    for (let attempt = 0; attempt < SHOPIFY_MAX_ATTEMPTS; attempt += 1) {
      const outcome = await this.attempt(session, operation, variables, attempt);
      if ('data' in outcome) {
        return outcome.data;
      }
      lastError = outcome.retry;
      if (attempt + 1 < SHOPIFY_MAX_ATTEMPTS) {
        await this.sleeper.sleep(outcome.delayMs);
      }
    }
    throw lastError;
  }

  private async attempt<TData, TVariables extends object>(
    session: ChannelSession,
    operation: ShopifyOperation<TData, TVariables>,
    variables: TVariables | undefined,
    attempt: number,
  ): Promise<AttemptOutcome<TData>> {
    let response: HttpResponse;
    try {
      response = await this.send(session, operation, variables);
    } catch {
      const retry = channelError(ChannelErrorCode.ChannelUnavailable, UNAVAILABLE);
      return { retry, delayMs: backoffDelayMs(attempt) };
    }
    return this.readResponse(response, operation, attempt);
  }

  private async send<TData, TVariables extends object>(
    session: ChannelSession,
    operation: ShopifyOperation<TData, TVariables>,
    variables: TVariables | undefined,
  ): Promise<HttpResponse> {
    return this.http.send({
      method: HttpMethod.Post,
      url: new URL(SHOPIFY_GRAPHQL_PATH, shopOrigin(session.externalAccountId)).toString(),
      headers: {
        [CONTENT_TYPE_HEADER]: JSON_CONTENT_TYPE,
        [ACCEPT_HEADER]: JSON_CONTENT_TYPE,
        [SHOPIFY_ACCESS_TOKEN_HEADER]: await session.accessToken(),
      },
      body: JSON.stringify({ query: operation.document, variables: variables ?? {} }),
    });
  }

  private readResponse<TData, TVariables extends object>(
    response: HttpResponse,
    operation: ShopifyOperation<TData, TVariables>,
    attempt: number,
  ): AttemptOutcome<TData> {
    const httpRetry = this.classifyStatus(response, attempt);
    if (httpRetry) {
      return httpRetry;
    }
    const envelope = shopifyGraphqlEnvelopeSchema.safeParse(parseJsonBody(response.body));
    if (!envelope.success) {
      throw channelError(ChannelErrorCode.ChannelUnavailable, UNAVAILABLE);
    }
    if (isThrottled(envelope.data)) {
      const retry = channelError(ChannelErrorCode.RateLimited, RATE_LIMITED);
      return { retry, delayMs: throttleDelayMs(envelope.data.extensions?.cost, attempt) };
    }
    return { data: this.readData(envelope.data, operation) };
  }

  /** A retry for statuses worth retrying; throws for the others; null for success. */
  private classifyStatus(response: HttpResponse, attempt: number): AttemptOutcome<never> | null {
    const { status } = response;
    if (isSuccessStatus(status)) {
      return null;
    }
    if (status === HTTP_STATUS_UNAUTHORIZED || status === HTTP_STATUS_FORBIDDEN) {
      throw channelError(ChannelErrorCode.CredentialsRejected, CREDENTIALS_REJECTED);
    }
    if (status === HTTP_STATUS_TOO_MANY_REQUESTS) {
      const retry = channelError(ChannelErrorCode.RateLimited, RATE_LIMITED);
      return { retry, delayMs: retryAfterDelayMs(response.headers, attempt) };
    }
    if (isServerErrorStatus(status)) {
      const retry = channelError(ChannelErrorCode.ChannelUnavailable, UNAVAILABLE);
      return { retry, delayMs: backoffDelayMs(attempt) };
    }
    throw channelError(
      ChannelErrorCode.RequestRejected,
      `Shopify rejected the request (${status})`,
    );
  }

  private readData<TData, TVariables extends object>(
    envelope: ShopifyGraphqlEnvelope,
    operation: ShopifyOperation<TData, TVariables>,
  ): TData {
    const [firstError] = envelope.errors ?? [];
    if (firstError) {
      throw channelError(
        ChannelErrorCode.RequestRejected,
        `${operation.name} failed: ${firstError.message}`,
      );
    }
    const data = operation.schema.safeParse(envelope.data);
    if (!data.success) {
      throw channelError(
        ChannelErrorCode.ChannelUnavailable,
        `${operation.name}: unexpected response`,
      );
    }
    return data.data;
  }
}
