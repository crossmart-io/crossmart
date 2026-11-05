import type { z } from 'zod';
import type { ChannelError } from '../errors/channel-error.js';
import { ChannelErrorCode } from '../errors/channel-error-code.enum.js';
import type { ChannelErrorFactory, ChannelErrorMessages } from '../errors/channel-error-factory.js';
import { bearerAuthorization } from './authorization.js';
import {
  ACCEPT_HEADER,
  AUTHORIZATION_HEADER,
  CONTENT_TYPE_HEADER,
  JSON_CONTENT_TYPE,
} from './http.constants.js';
import type { HttpMethod } from './http-method.enum.js';
import { isSuccessStatus } from './http-status.js';
import type { HttpResponse, HttpTransport } from './http-transport.js';
import { parseJsonBody } from './parse-json.js';

/** Joins a code's message and the channel's own explanation. */
const DETAIL_SEPARATOR = ': ';

/** One call to a channel's JSON API on behalf of a user. */
export interface JsonApiRequest {
  method: HttpMethod;
  accessToken: string;
  /** Sent as JSON. */
  body?: unknown;
}

/** What a failed response means, as a channel reads its error body. */
export interface JsonApiFailure {
  code: ChannelErrorCode;
  /** The channel's own explanation, safe to show (never the body); follows the code's message. */
  detail?: string | null;
  /** Replaces the code's message, for a cause the channel names exactly. */
  message?: string;
}

/** How a channel's errors read: its `ChannelError` factory and a message per code. */
export interface JsonApiErrorProfile {
  error: ChannelErrorFactory;
  messages: ChannelErrorMessages;
}

/**
 * Calls a channel's JSON API with a user's bearer token and validates each response against a
 * schema. Failures become `ChannelError`s that name a cause: transport failures and responses
 * that do not match the schema are outages, and the channel's `describeFailure` reads the rest.
 * Subclasses say where a request goes, and may add headers.
 */
export abstract class JsonApiClient<TRequest extends JsonApiRequest> {
  protected constructor(
    private readonly http: HttpTransport,
    private readonly errors: JsonApiErrorProfile,
  ) {}

  /** Sends the request and validates the JSON it answers. */
  async call<TData>(request: TRequest, schema: z.ZodType<TData>): Promise<TData> {
    return this.parse(await this.request(request), schema);
  }

  /** Sends a request whose success has no body worth reading (204, or an echo). */
  async execute(request: TRequest): Promise<void> {
    this.assertSuccess(await this.request(request));
  }

  /** The raw response, whatever its status. Rejects only when the channel could not be reached. */
  async request(request: TRequest): Promise<HttpResponse> {
    try {
      return await this.http.send({
        method: request.method,
        url: this.url(request).toString(),
        headers: this.headers(request),
        ...(request.body === undefined ? {} : { body: JSON.stringify(request.body) }),
      });
    } catch {
      throw this.error({ code: ChannelErrorCode.ChannelUnavailable });
    }
  }

  /** Validates a successful response's JSON; throws the error a failed one means. */
  parse<TData>(response: HttpResponse, schema: z.ZodType<TData>): TData {
    this.assertSuccess(response);
    const parsed = schema.safeParse(parseJsonBody(response.body));
    if (!parsed.success) {
      throw this.error({ code: ChannelErrorCode.ChannelUnavailable });
    }
    return parsed.data;
  }

  /** Throws the `ChannelError` a failed response means. */
  assertSuccess(response: HttpResponse): void {
    if (isSuccessStatus(response.status)) return;
    throw this.error(this.describeFailure(response));
  }

  /** Where the request goes. */
  protected abstract url(request: TRequest): URL;

  /** What a failed response means: the code callers act on, and a safe detail. */
  protected abstract describeFailure(response: HttpResponse): JsonApiFailure;

  /** The bearer token and JSON headers; channels may add their own. */
  protected headers(request: TRequest): Record<string, string> {
    return {
      [AUTHORIZATION_HEADER]: bearerAuthorization(request.accessToken),
      [ACCEPT_HEADER]: JSON_CONTENT_TYPE,
      ...(request.body === undefined ? {} : { [CONTENT_TYPE_HEADER]: JSON_CONTENT_TYPE }),
    };
  }

  private error({ code, detail, message }: JsonApiFailure): ChannelError {
    const text = message ?? this.errors.messages[code];
    return this.errors.error(code, detail ? `${text}${DETAIL_SEPARATOR}${detail}` : text);
  }
}
