import { randomUUID } from 'node:crypto';
import type { WebhookRequest } from '../../webhooks/entities/delivery-attempt.js';
import { toUnixSeconds, webhookSignatureHeader } from '../../webhooks/rules/webhook-signature.js';
import {
  WEBHOOK_API_VERSION,
  WEBHOOK_CONTENT_TYPE,
  WEBHOOK_USER_AGENT,
  WebhookHeader,
} from '../../webhooks/webhooks.constants.js';
import { ASK_ESCALATION_REPLIED_EVENT } from '../ask.constants.js';
import type { AskEscalationReason } from '../enums/ask-escalation-reason.enum.js';
import { AskEscalationStatus } from '../enums/ask-escalation-status.enum.js';

/** What the callback says about the reply. The ticket id is never sent: only its holder knows it. */
export interface EscalationCallbackInput {
  url: string;
  secret: string;
  escalationId: string;
  conversationId: string;
  reason: AskEscalationReason;
  reply: string;
  repliedAt: Date;
  sentAt: Date;
}

/**
 * The signed callback request, in the envelope and with the headers and `Crossmart-Signature`
 * of outgoing webhooks (ADR 0023), so receivers verify it with the SDKs' webhook helpers.
 */
export function escalationCallbackRequest(input: EscalationCallbackInput): WebhookRequest {
  const eventId = randomUUID();
  const body = JSON.stringify({
    id: eventId,
    type: ASK_ESCALATION_REPLIED_EVENT,
    createdAt: input.sentAt.toISOString(),
    apiVersion: WEBHOOK_API_VERSION,
    data: {
      conversationId: input.conversationId,
      reason: input.reason,
      status: AskEscalationStatus.Replied,
      reply: input.reply,
      repliedAt: input.repliedAt.toISOString(),
    },
  });
  return {
    url: input.url,
    body,
    headers: {
      [WebhookHeader.ContentType]: WEBHOOK_CONTENT_TYPE,
      [WebhookHeader.UserAgent]: WEBHOOK_USER_AGENT,
      [WebhookHeader.Signature]: webhookSignatureHeader(
        [input.secret],
        toUnixSeconds(input.sentAt),
        body,
      ),
      [WebhookHeader.EventId]: eventId,
      [WebhookHeader.EventType]: ASK_ESCALATION_REPLIED_EVENT,
      [WebhookHeader.DeliveryId]: input.escalationId,
    },
  };
}
