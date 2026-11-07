import { Injectable } from '@nestjs/common';
import { requireEnumValue } from '@crossmart/common';
import type { AskEscalation } from '@crossmart/database';
import { WebhookSender } from '../../webhooks/services/webhook-sender.js';
import { AskEscalationReason } from '../enums/ask-escalation-reason.enum.js';
import { AskEscalationRepository } from '../repositories/ask-escalation.repository.js';
import { escalationCallbackRequest } from '../rules/escalation-callback.js';
import { AskCallerKeys } from './ask-caller-keys.js';

/** An escalation with its reply stored. */
export type RepliedEscalation = AskEscalation & { reply: string; repliedAt: Date };

/**
 * POSTs a reply to the escalation's callback URL, signed like outgoing webhooks with the
 * per-ticket secret, through the guarded webhook sender (ADR 0023's SSRF rules), once; and
 * stores how it went for the admins to see.
 */
@Injectable()
export class AskEscalationCallback {
  constructor(
    private readonly sender: WebhookSender,
    private readonly escalations: AskEscalationRepository,
    private readonly keys: AskCallerKeys,
  ) {}

  async deliver(escalation: RepliedEscalation, url: string, conversationId: string): Promise<void> {
    const sentAt = new Date();
    const result = await this.sender.send(
      escalationCallbackRequest({
        url,
        secret: this.keys.callbackSecret(escalation.tokenHash),
        escalationId: escalation.id,
        conversationId,
        reason: requireEnumValue(AskEscalationReason, escalation.reason),
        reply: escalation.reply,
        repliedAt: escalation.repliedAt,
        sentAt,
      }),
    );
    await this.escalations.saveCallbackResult(escalation.id, {
      callbackDeliveredAt: result.succeeded ? sentAt : null,
      callbackError: result.error,
    });
  }
}
