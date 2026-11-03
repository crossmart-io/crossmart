import { HTTP_STATUS_SUCCESS_MIN, JSON_CONTENT_TYPE } from '../http/http.constants.js';
import type { HttpMethod } from '../http/http-method.enum.js';
import { HttpTransport, type HttpRequest, type HttpResponse } from '../http/http-transport.js';

type UrlMatcher = string | RegExp;
type Responder = HttpResponse | Error | ((request: HttpRequest) => HttpResponse);

interface ExpectedCall {
  method: HttpMethod;
  url: UrlMatcher;
  respond: Responder;
}

/** A JSON response, as a fixture or a fabricated reply. */
export function jsonResponse(
  body: unknown,
  status = HTTP_STATUS_SUCCESS_MIN,
  headers: Record<string, string> = {},
): HttpResponse {
  const serialized = typeof body === 'string' ? body : JSON.stringify(body);
  return { status, headers: { 'content-type': JSON_CONTENT_TYPE, ...headers }, body: serialized };
}

/**
 * Replays expected calls in order, so connector tests run on fixtures and never reach a real
 * channel. Every call is recorded; an unexpected call fails loudly, naming only its method
 * and URL (never headers or bodies, which hold tokens).
 */
export class FakeHttpTransport extends HttpTransport {
  readonly requests: HttpRequest[] = [];
  private readonly expected: ExpectedCall[] = [];

  /** Expects one call to `url` (a full URL, or a pattern) and answers it with `respond`. */
  expect(method: HttpMethod, url: UrlMatcher, respond: Responder): this {
    this.expected.push({ method, url, respond });
    return this;
  }

  send(request: HttpRequest): Promise<HttpResponse> {
    this.requests.push(request);
    const index = this.expected.findIndex((call) => this.matches(call, request));
    if (index < 0) {
      return Promise.reject(new Error(`Unexpected ${request.method} ${request.url}`));
    }
    const [call] = this.expected.splice(index, 1);
    if (call.respond instanceof Error) {
      return Promise.reject(call.respond);
    }
    return Promise.resolve(
      typeof call.respond === 'function' ? call.respond(request) : call.respond,
    );
  }

  /** Throws when an expected call was never made. */
  assertDone(): void {
    if (this.expected.length > 0) {
      const pending = this.expected.map((call) => `${call.method} ${String(call.url)}`);
      throw new Error(`Expected calls were not made: ${pending.join(', ')}`);
    }
  }

  private matches(call: ExpectedCall, request: HttpRequest): boolean {
    if (call.method !== request.method) {
      return false;
    }
    return typeof call.url === 'string' ? call.url === request.url : call.url.test(request.url);
  }
}
