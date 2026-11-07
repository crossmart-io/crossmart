import { Injectable } from '@nestjs/common';
import { WebhookUrlPolicy } from '../../webhooks/services/webhook-url.policy.js';
import { ASK_ESCALATION_QUOTA_KEY_PREFIX, ASK_ESCALATIONS_PER_DAY } from '../ask.constants.js';
import { AskQuota } from '../cache/ask-quota.js';
import type { AskCaller } from '../entities/ask-caller.js';
import type { AskEscalationInput } from '../entities/ask-records.js';
import {
  AskEscalationLimitReachedError,
  AskEscalationNotFoundError,
} from '../errors/ask.errors.js';
import {
  type AskConversationWithTurns,
  AskInsightsRepository,
} from '../repositories/ask-insights.repository.js';
import { AskConversationsService } from './ask-conversations.service.js';

/** An escalation that may be opened: its conversation, whole, and its checked callback URL. */
export interface AdmittedEscalation {
  conversation: AskConversationWithTurns;
  callbackUrl: string | null;
}

/**
 * Decides whether a caller may escalate: the conversation must be theirs and live, a callback
 * URL must pass the webhook SSRF policy (ADR 0023), and the caller must have escalations left
 * today. Each escalation emails a person, so they are few.
 */
@Injectable()
export class AskEscalationIntake {
  constructor(
    private readonly conversations: AskConversationsService,
    private readonly insights: AskInsightsRepository,
    private readonly urlPolicy: WebhookUrlPolicy,
    private readonly quota: AskQuota,
  ) {}

  async admit(
    input: AskEscalationInput,
    caller: AskCaller,
    now: Date,
  ): Promise<AdmittedEscalation> {
    const owned = await this.conversations.requireOwned(input.conversationId, caller, now);
    const callbackUrl = input.callbackUrl
      ? await this.urlPolicy.assertAllowed(input.callbackUrl)
      : null;
    await this.takeEscalation(caller, now);
    return { conversation: await this.requireConversation(owned.id), callbackUrl };
  }

  /** A conversation with its turns, for the team's email and the callback. */
  async requireConversation(conversationId: string): Promise<AskConversationWithTurns> {
    const conversation = await this.insights.findConversation(conversationId);
    if (!conversation) throw new AskEscalationNotFoundError();
    return conversation;
  }

  private async takeEscalation(caller: AskCaller, now: Date): Promise<void> {
    const allowed = await this.quota.tryTake(
      ASK_ESCALATION_QUOTA_KEY_PREFIX,
      caller.ownerKey,
      ASK_ESCALATIONS_PER_DAY,
      now,
    );
    if (!allowed) throw new AskEscalationLimitReachedError();
  }
}
