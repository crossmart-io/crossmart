import { Injectable } from '@nestjs/common';
import { findEnumValue } from '@crossmart/common';
import type { AskEscalation } from '@crossmart/database';
import type { AskCaller } from '../entities/ask-caller.js';
import type {
  AskEscalationInput,
  AskEscalationRecord,
  AskEscalationTicket,
  OpenedAskEscalation,
} from '../entities/ask-records.js';
import { AskEscalationReason } from '../enums/ask-escalation-reason.enum.js';
import { AskEscalationStatus } from '../enums/ask-escalation-status.enum.js';
import {
  AskEscalationAlreadyRepliedError,
  AskEscalationNotFoundError,
} from '../errors/ask.errors.js';
import { toEscalationRecord, toEscalationTicket } from '../mappers/ask-records.mapper.js';
import { AskEscalationRepository } from '../repositories/ask-escalation.repository.js';
import type { AskConversationWithTurns } from '../repositories/ask-insights.repository.js';
import { newEscalationToken, tokenHash } from '../rules/ask-tokens.js';
import { AskCallerKeys } from './ask-caller-keys.js';
import { AskEscalationIntake } from './ask-escalation.intake.js';
import { AskEscalationNotifier } from './ask-escalation.notifier.js';

/** Why Ask last offered a person in the conversation; a request for one when it never did. */
function offeredReason(conversation: AskConversationWithTurns): AskEscalationReason {
  const offered = conversation.turns.findLast((turn) => turn.escalationReason !== null);
  return (
    findEnumValue(AskEscalationReason, offered?.escalationReason) ??
    AskEscalationReason.HumanRequested
  );
}

/** A platform admin's reply to an escalation. */
export interface AskEscalationReplyInput {
  escalationId: string;
  reply: string;
  /** The admin's email, stored with the reply. */
  repliedBy: string;
}

/**
 * Escalations to a person (ADR 0025): a caller opens one on their own conversation, a few a
 * day, and polls it with the ticket id; a platform admin replies, which reaches the caller by
 * email and by a signed callback. Only a hash of the ticket id is stored.
 */
@Injectable()
export class AskEscalationsService {
  constructor(
    private readonly escalations: AskEscalationRepository,
    private readonly intake: AskEscalationIntake,
    private readonly keys: AskCallerKeys,
    private readonly notifier: AskEscalationNotifier,
  ) {}

  async open(
    input: AskEscalationInput,
    caller: AskCaller,
    now = new Date(),
  ): Promise<OpenedAskEscalation> {
    const { conversation, callbackUrl } = await this.intake.admit(input, caller, now);
    const token = newEscalationToken();
    const escalation = await this.escalations.create(
      {
        conversationId: conversation.id,
        tokenHash: tokenHash(token),
        reason: input.reason ?? offeredReason(conversation),
        status: AskEscalationStatus.Open,
        contactEmail: input.contactEmail ?? null,
        callbackUrl,
        createdAt: now,
      },
      now,
    );
    this.notifier.teamNeeded(escalation, conversation);
    const callbackSecret = callbackUrl ? this.keys.callbackSecret(escalation.tokenHash) : null;
    return { ...toEscalationTicket(token, escalation), callbackSecret };
  }

  /** The escalation this ticket id opens; 404 for any other id. */
  async ticket(token: string): Promise<AskEscalationTicket> {
    const escalation = await this.escalations.findByTokenHash(tokenHash(token));
    if (!escalation) throw new AskEscalationNotFoundError();
    return toEscalationTicket(token, escalation);
  }

  /** Stores a platform admin's reply once, then sends it to the asker. */
  async reply(input: AskEscalationReplyInput, now = new Date()): Promise<AskEscalationRecord> {
    const saved = await this.escalations.saveReply(input.escalationId, {
      reply: input.reply,
      repliedBy: input.repliedBy,
      repliedAt: now,
    });
    const escalation = await this.requireById(input.escalationId);
    if (!saved) throw new AskEscalationAlreadyRepliedError();
    const conversation = await this.intake.requireConversation(escalation.conversationId);
    await this.notifier.replied(escalation, conversation.publicId);
    return toEscalationRecord(await this.requireById(escalation.id));
  }

  /** Escalations for the admins, newest first, optionally only open or replied ones. */
  async list(
    status: AskEscalationStatus | undefined,
    limit: number,
  ): Promise<AskEscalationRecord[]> {
    const rows = await this.escalations.list(status ? { status } : {}, limit);
    return rows.map(toEscalationRecord);
  }

  private async requireById(id: string): Promise<AskEscalation> {
    const escalation = await this.escalations.findById(id);
    if (!escalation) throw new AskEscalationNotFoundError();
    return escalation;
  }
}
