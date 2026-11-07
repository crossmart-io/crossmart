import { signWebhookPayload, toUnixSeconds } from '../../webhooks/rules/webhook-signature.js';
import { WebhookHeader } from '../../webhooks/webhooks.constants.js';
import { ASK_ESCALATION_REPLIED_EVENT } from '../ask.constants.js';
import { AskEscalationReason } from '../enums/ask-escalation-reason.enum.js';
import { escalationCallbackRequest } from './escalation-callback.js';

const SENT_AT = new Date('2026-11-07T10:00:00Z');
const INPUT = {
  url: 'https://agent.example/callback',
  secret: 'whsec_test',
  escalationId: 'escalation-1',
  conversationId: 'conv_abc',
  reason: AskEscalationReason.Sales,
  reply: 'We will email you a quote.',
  repliedAt: SENT_AT,
  sentAt: SENT_AT,
};

describe('escalationCallbackRequest', () => {
  it('signs the body like an outgoing webhook', () => {
    const request = escalationCallbackRequest(INPUT);
    const timestamp = toUnixSeconds(SENT_AT);

    expect(request.headers[WebhookHeader.Signature]).toBe(
      `t=${timestamp},v1=${signWebhookPayload(INPUT.secret, timestamp, request.body)}`,
    );
    expect(request.headers[WebhookHeader.EventType]).toBe(ASK_ESCALATION_REPLIED_EVENT);
  });

  it('carries the reply and the conversation, never the ticket id', () => {
    const body = JSON.parse(escalationCallbackRequest(INPUT).body);

    expect(body).toMatchObject({
      type: ASK_ESCALATION_REPLIED_EVENT,
      apiVersion: 'v1',
      data: { conversationId: 'conv_abc', reply: INPUT.reply, status: 'replied' },
    });
    expect(JSON.stringify(body)).not.toContain('esc_');
  });
});
