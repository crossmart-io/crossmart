import { lookup } from 'node:dns/promises';
import { Injectable } from '@nestjs/common';

/** Every address a host name resolves to. A seam, so URL checks run without DNS in tests. */
export abstract class WebhookHostResolver {
  abstract resolve(hostname: string): Promise<string[]>;
}

/** Resolves with the system resolver, as the delivery's socket will. */
@Injectable()
export class DnsWebhookHostResolver extends WebhookHostResolver {
  async resolve(hostname: string): Promise<string[]> {
    const addresses = await lookup(hostname, { all: true });
    return addresses.map(({ address }) => address);
  }
}
