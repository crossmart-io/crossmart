import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { WebhookRequest } from '../entities/delivery-attempt.js';
import { WebhookDeliveryFailure } from '../enums/webhook-delivery-failure.enum.js';
import { WEBHOOK_REQUEST_TIMEOUT_MS, WEBHOOK_RESPONSE_MAX_BYTES } from '../webhooks.constants.js';
import { HttpWebhookSender } from './http-webhook.sender.js';
import type { WebhookUrlPolicy } from './webhook-url.policy.js';

const LOCALHOST = '127.0.0.1';
const BODY = JSON.stringify({ id: 'evt-1', type: 'order.created', data: { name: 'Café' } });
const HEADERS = { 'Content-Type': 'application/json', 'Crossmart-Event-Id': 'evt-1' };

type Handler = (request: IncomingMessage, body: string, response: ServerResponse) => void;

interface ReceivedRequest {
  method: string | undefined;
  url: string | undefined;
  headers: IncomingMessage['headers'];
  body: string;
}

interface TestServer {
  url: string;
  received: ReceivedRequest[];
  close: () => Promise<void>;
}

/** A local server that records what it receives and answers with `handler`. */
async function startServer(handler: Handler): Promise<TestServer> {
  const received: ReceivedRequest[] = [];
  const server: Server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', () => {
      const body = Buffer.concat(chunks).toString();
      received.push({ method: request.method, url: request.url, headers: request.headers, body });
      handler(request, body, response);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, LOCALHOST, resolve));
  const { port } = server.address() as AddressInfo;
  const close = (): Promise<void> => {
    server.closeAllConnections();
    return new Promise((resolve) => server.close(() => resolve()));
  };
  return { url: `http://${LOCALHOST}:${port}`, received, close };
}

function senderWith(allowsPrivateAddresses: boolean): HttpWebhookSender {
  return new HttpWebhookSender({ allowsPrivateAddresses } as unknown as WebhookUrlPolicy);
}

function requestTo(url: string): WebhookRequest {
  return { url, body: BODY, headers: HEADERS };
}

function answerWith(status: number, headers: Record<string, string> = {}): Handler {
  return (_request, _body, response) => {
    response.writeHead(status, headers);
    response.end('ok');
  };
}

describe('HttpWebhookSender on a trusted network', () => {
  const sender = senderWith(true);
  let server: TestServer | undefined;

  afterEach(async () => {
    await server?.close();
    server = undefined;
  });

  it('POSTs the body and headers as given and reports a 2xx answer as a success', async () => {
    server = await startServer(answerWith(204));

    const result = await sender.send(requestTo(`${server.url}/hooks`));

    expect(result).toMatchObject({ succeeded: true, responseStatus: 204, error: null });
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    const [received] = server.received;
    expect(received?.method).toBe('POST');
    expect(received?.url).toBe('/hooks');
    expect(received?.body).toBe(BODY);
    expect(received?.headers['content-type']).toBe('application/json');
    expect(received?.headers['crossmart-event-id']).toBe('evt-1');
    expect(received?.headers['content-length']).toBe(String(Buffer.byteLength(BODY)));
  });

  it('reports an error status as a failure that names the status', async () => {
    server = await startServer(answerWith(500));

    expect(await sender.send(requestTo(server.url))).toMatchObject({
      succeeded: false,
      responseStatus: 500,
      error: 'The endpoint answered with HTTP 500',
    });
  });

  it('never follows a redirect', async () => {
    const target = await startServer(answerWith(200));

    for (const status of [301, 302]) {
      server = await startServer(answerWith(status, { Location: `${target.url}/elsewhere` }));
      expect(await sender.send(requestTo(server.url))).toMatchObject({
        succeeded: false,
        responseStatus: status,
        error: WebhookDeliveryFailure.Redirect,
      });
      await server.close();
      server = undefined;
    }
    expect(target.received).toHaveLength(0);
    await target.close();
  });

  it('still reports the status of an answer larger than it reads', async () => {
    server = await startServer((_request, _body, response) => {
      response.writeHead(200);
      response.end(Buffer.alloc(WEBHOOK_RESPONSE_MAX_BYTES * 4, 'x'));
    });

    expect(await sender.send(requestTo(server.url))).toMatchObject({
      succeeded: true,
      responseStatus: 200,
    });
  });

  it('reports a closed port as unreachable', async () => {
    const closed = await startServer(answerWith(200));
    await closed.close();

    expect(await sender.send(requestTo(closed.url))).toMatchObject({
      succeeded: false,
      responseStatus: null,
      error: WebhookDeliveryFailure.Unreachable,
    });
  });
});

describe('HttpWebhookSender timeouts', () => {
  const sender = senderWith(true);

  afterEach(() => {
    vi.useRealTimers();
  });

  async function sendAndTimeOut(server: TestServer) {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const pending = sender.send(requestTo(server.url));
    await vi.waitFor(() => expect(server.received).toHaveLength(1));
    await vi.advanceTimersByTimeAsync(WEBHOOK_REQUEST_TIMEOUT_MS);
    const result = await pending;
    vi.useRealTimers();
    await server.close();
    return result;
  }

  it('gives up on an endpoint that never answers', async () => {
    const result = await sendAndTimeOut(await startServer(() => undefined));

    expect(result).toMatchObject({
      succeeded: false,
      responseStatus: null,
      error: WebhookDeliveryFailure.Timeout,
    });
  });

  it('gives up on an endpoint that sends its status but never finishes its body', async () => {
    const result = await sendAndTimeOut(
      await startServer((_request, _body, response) => {
        response.writeHead(200);
        response.write('partial');
      }),
    );

    expect(result).toMatchObject({ succeeded: false, error: WebhookDeliveryFailure.Timeout });
  });
});

describe('HttpWebhookSender on the public internet', () => {
  const sender = senderWith(false);

  it('refuses a private IP literal without connecting', async () => {
    const server = await startServer(answerWith(200));

    const result = await sender.send(requestTo(server.url));

    expect(result).toMatchObject({
      succeeded: false,
      responseStatus: null,
      error: WebhookDeliveryFailure.PrivateAddress,
    });
    expect(server.received).toHaveLength(0);
    await server.close();
  });

  it('refuses a host name that resolves to a private address as it connects', async () => {
    const server = await startServer(answerWith(200));
    const port = new URL(server.url).port;

    const result = await sender.send(requestTo(`http://localhost:${port}/in`));

    expect(result.error).toBe(WebhookDeliveryFailure.PrivateAddress);
    expect(server.received).toHaveLength(0);
    await server.close();
  });
});
