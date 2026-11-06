import { Injectable } from '@nestjs/common';
import { HTTP_REQUEST_TIMEOUT_MS } from './http.constants.js';
import { HttpTransport, type HttpRequest, type HttpResponse } from './http-transport.js';

/** The production transport: Node's `fetch`, with a timeout on every call. */
@Injectable()
export class FetchHttpTransport extends HttpTransport {
  async send(request: HttpRequest): Promise<HttpResponse> {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.bytes ?? request.body,
      redirect: 'error',
      signal: AbortSignal.timeout(HTTP_REQUEST_TIMEOUT_MS),
    });
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: await response.text(),
    };
  }
}
