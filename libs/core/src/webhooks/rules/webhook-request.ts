import type { WebhookRequest } from '../entities/delivery-attempt.js';
import type { WebhookEnvelope } from '../entities/webhook-envelope.js';
import { WEBHOOK_CONTENT_TYPE, WEBHOOK_USER_AGENT, WebhookHeader } from '../webhooks.constants.js';
import { toUnixSeconds, webhookSignatureHeader } from './webhook-signature.js';

/** What one request needs: the envelope, where it goes, and the secrets that sign it. */
export interface WebhookRequestInput {
  url: string;
  deliveryId: string;
  envelope: WebhookEnvelope;
  secrets: readonly string[];
  sentAt: Date;
}

/** The signed request for one attempt. Each attempt is signed afresh, with its own timestamp. */
export function buildWebhookRequest(input: WebhookRequestInput): WebhookRequest {
  const body = JSON.stringify(input.envelope);
  const signature = webhookSignatureHeader(input.secrets, toUnixSeconds(input.sentAt), body);
  return {
    url: input.url,
    body,
    headers: {
      [WebhookHeader.ContentType]: WEBHOOK_CONTENT_TYPE,
      [WebhookHeader.UserAgent]: WEBHOOK_USER_AGENT,
      [WebhookHeader.Signature]: signature,
      [WebhookHeader.EventId]: input.envelope.id,
      [WebhookHeader.EventType]: input.envelope.type,
      [WebhookHeader.DeliveryId]: input.deliveryId,
    },
  };
}
