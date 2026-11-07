import { Module } from '@nestjs/common';
import { HttpWebhookSender } from './services/http-webhook.sender.js';
import { DnsWebhookHostResolver, WebhookHostResolver } from './services/webhook-host.resolver.js';
import { WebhookSender } from './services/webhook-sender.js';
import { WebhookUrlPolicy } from './services/webhook-url.policy.js';

/**
 * Sending signed requests to URLs someone else chose, with the SSRF rules of ADR 0023: the URL
 * policy and the guarded sender. Shared by outgoing webhooks and Ask's escalation callbacks.
 */
@Module({
  providers: [
    WebhookUrlPolicy,
    { provide: WebhookHostResolver, useClass: DnsWebhookHostResolver },
    { provide: WebhookSender, useClass: HttpWebhookSender },
  ],
  exports: [WebhookUrlPolicy, WebhookHostResolver, WebhookSender],
})
export class WebhookTransportModule {}
