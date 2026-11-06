import { createServer, type IncomingHttpHeaders, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

/** One request the receiver got, with its body exactly as sent. */
export interface ReceivedWebhook {
  headers: IncomingHttpHeaders;
  body: string;
}

const LOOPBACK = '127.0.0.1';
const OK = 200;

/** A local HTTP server that records webhook requests and answers with a chosen status. */
export class WebhookReceiver {
  readonly received: ReceivedWebhook[] = [];
  status = OK;
  private readonly server: Server;

  constructor() {
    this.server = createServer((request, response) => {
      const chunks: Buffer[] = [];
      request.on('data', (chunk: Buffer) => chunks.push(chunk));
      request.on('end', () => {
        this.received.push({ headers: request.headers, body: Buffer.concat(chunks).toString() });
        response.writeHead(this.status).end();
      });
    });
  }

  get url(): string {
    const { port } = this.server.address() as AddressInfo;
    return `http://${LOOPBACK}:${port}/crossmart`;
  }

  start(): Promise<void> {
    return new Promise((resolve) => this.server.listen(0, LOOPBACK, resolve));
  }

  stop(): Promise<void> {
    return new Promise((resolve) => this.server.close(() => resolve()));
  }
}
