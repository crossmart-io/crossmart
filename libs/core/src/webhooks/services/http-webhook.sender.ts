import { lookup as dnsLookup } from 'node:dns';
import { type ClientRequest, type IncomingMessage, request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import type { LookupFunction } from 'node:net';
import { performance } from 'node:perf_hooks';
import { Injectable } from '@nestjs/common';
import { guardedLookup, isPublicAddress, PrivateAddressError } from '@crossmart/common';
import type { DeliveryAttemptResult, WebhookRequest } from '../entities/delivery-attempt.js';
import { WebhookDeliveryFailure } from '../enums/webhook-delivery-failure.enum.js';
import { resultOfFailure, resultOfStatus } from '../rules/delivery-response.js';
import { hostOf, isIpLiteral, UrlProtocol } from '../rules/webhook-url.js';
import { WEBHOOK_REQUEST_TIMEOUT_MS, WEBHOOK_RESPONSE_MAX_BYTES } from '../webhooks.constants.js';
import { WebhookSender } from './webhook-sender.js';
import { WebhookUrlPolicy } from './webhook-url.policy.js';

const POST_METHOD = 'POST';
const CONTENT_LENGTH_HEADER = 'Content-Length';

class DeliveryTimeoutError extends Error {}

function failureOf(error: unknown): WebhookDeliveryFailure {
  if (error instanceof DeliveryTimeoutError) return WebhookDeliveryFailure.Timeout;
  if (error instanceof PrivateAddressError) return WebhookDeliveryFailure.PrivateAddress;
  return WebhookDeliveryFailure.Unreachable;
}

/** Reads and drops the response, up to the size cap; the body is never kept. */
function drain(response: IncomingMessage): Promise<void> {
  return new Promise((resolve) => {
    let size = 0;
    response.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > WEBHOOK_RESPONSE_MAX_BYTES) response.destroy();
    });
    response.on('end', resolve);
    response.on('close', resolve);
    response.on('error', () => resolve());
  });
}

/**
 * POSTs deliveries over http(s) with the SSRF rules of ADR 0023: public addresses only
 * (checked as each socket connects, so DNS rebinding cannot slip past the URL check), no
 * redirects followed, a timeout, and at most a small, discarded part of the response read.
 */
@Injectable()
export class HttpWebhookSender extends WebhookSender {
  private readonly allowPrivate: boolean;
  private readonly lookup: LookupFunction | undefined;

  constructor(policy: WebhookUrlPolicy) {
    super();
    this.allowPrivate = policy.allowsPrivateAddresses;
    this.lookup = this.allowPrivate ? undefined : guardedLookup(dnsLookup);
  }

  async send(request: WebhookRequest): Promise<DeliveryAttemptResult> {
    const startedAt = performance.now();
    const elapsed = (): number => Math.round(performance.now() - startedAt);
    const url = new URL(request.url);
    if (!this.allowPrivate && isIpLiteral(url) && !isPublicAddress(hostOf(url))) {
      return resultOfFailure(WebhookDeliveryFailure.PrivateAddress, elapsed());
    }
    try {
      const status = await this.post(url, request);
      return resultOfStatus(status, elapsed());
    } catch (error) {
      return resultOfFailure(failureOf(error), elapsed());
    }
  }

  private post(url: URL, request: WebhookRequest): Promise<number> {
    return new Promise((resolve, reject) => {
      const outgoing = this.open(url, request);
      // One deadline for the whole exchange, so a server that answers slowly cannot hold it.
      const deadline = setTimeout(
        () => outgoing.destroy(new DeliveryTimeoutError()),
        WEBHOOK_REQUEST_TIMEOUT_MS,
      );
      outgoing.on('response', (response: IncomingMessage) => {
        void drain(response).then(() => {
          clearTimeout(deadline);
          resolve(response.statusCode ?? 0);
        });
      });
      outgoing.on('error', (error) => {
        clearTimeout(deadline);
        reject(error);
      });
      outgoing.end(request.body);
    });
  }

  private open(url: URL, request: WebhookRequest): ClientRequest {
    const send = url.protocol === UrlProtocol.Https ? httpsRequest : httpRequest;
    return send(url, {
      method: POST_METHOD,
      lookup: this.lookup,
      headers: { ...request.headers, [CONTENT_LENGTH_HEADER]: Buffer.byteLength(request.body) },
    });
  }
}
