import { z } from 'zod';
import { findEnumValue, requireEnumValue } from '@crossmart/common';
import type { AskConversation, AskEscalation, AskTurn } from '@crossmart/database';
import type { AskCitation } from '../entities/ask-answer.js';
import type {
  AskConversationSummary,
  AskEscalationRecord,
  AskEscalationTicket,
  AskTurnRecord,
} from '../entities/ask-records.js';
import { AccountLookupKind } from '../enums/account-lookup-kind.enum.js';
import { AskCallerType } from '../enums/ask-caller-type.enum.js';
import { AskChannel } from '../enums/ask-channel.enum.js';
import { AskConfidence } from '../enums/ask-confidence.enum.js';
import { AskEscalationReason } from '../enums/ask-escalation-reason.enum.js';
import { AskEscalationStatus } from '../enums/ask-escalation-status.enum.js';
import { AskOutcome } from '../enums/ask-outcome.enum.js';

const storedCitationsSchema = z.array(z.object({ title: z.string(), url: z.string() }));

/** The citations stored with a turn; an entry that no longer parses is dropped whole. */
export function storedCitations(value: unknown): AskCitation[] {
  const parsed = storedCitationsSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

function lookupsOf(values: readonly string[]): AccountLookupKind[] {
  return values.flatMap((value) => {
    const kind = findEnumValue(AccountLookupKind, value);
    return kind ? [kind] : [];
  });
}

export function toTurnRecord(turn: AskTurn): AskTurnRecord {
  return {
    id: turn.id,
    position: turn.position,
    question: turn.question,
    answer: turn.answer,
    outcome: requireEnumValue(AskOutcome, turn.outcome),
    confidence: requireEnumValue(AskConfidence, turn.confidence),
    citations: storedCitations(turn.citations),
    accountLookups: lookupsOf(turn.accountLookups),
    escalationReason: findEnumValue(AskEscalationReason, turn.escalationReason) ?? null,
    latencyMs: turn.latencyMs,
    model: turn.model,
    cached: turn.cached,
    createdAt: turn.createdAt,
  };
}

export function toEscalationRecord(escalation: AskEscalation): AskEscalationRecord {
  return {
    id: escalation.id,
    conversationId: escalation.conversationId,
    reason: requireEnumValue(AskEscalationReason, escalation.reason),
    status: requireEnumValue(AskEscalationStatus, escalation.status),
    contactEmail: escalation.contactEmail,
    callbackUrl: escalation.callbackUrl,
    reply: escalation.reply,
    repliedAt: escalation.repliedAt,
    repliedBy: escalation.repliedBy,
    callbackDeliveredAt: escalation.callbackDeliveredAt,
    callbackError: escalation.callbackError,
    createdAt: escalation.createdAt,
  };
}

/** What the caller sees of their escalation when they poll it with the ticket id. */
export function toEscalationTicket(token: string, escalation: AskEscalation): AskEscalationTicket {
  return {
    id: token,
    status: requireEnumValue(AskEscalationStatus, escalation.status),
    reason: requireEnumValue(AskEscalationReason, escalation.reason),
    reply: escalation.reply,
    repliedAt: escalation.repliedAt,
    createdAt: escalation.createdAt,
  };
}

/** The first and the latest turn of a conversation, for its line in the list. */
export interface ConversationEnds {
  first: Pick<AskTurn, 'question'> | null;
  last: Pick<AskTurn, 'outcome'> | null;
}

export function toConversationSummary(
  conversation: AskConversation,
  ends: ConversationEnds,
): AskConversationSummary {
  return {
    id: conversation.id,
    channel: requireEnumValue(AskChannel, conversation.channel),
    callerType: requireEnumValue(AskCallerType, conversation.callerType),
    clientName: conversation.clientName,
    workspaceId: conversation.workspaceId,
    turnCount: conversation.turnCount,
    firstQuestion: ends.first?.question ?? null,
    lastOutcome: ends.last ? requireEnumValue(AskOutcome, ends.last.outcome) : null,
    escalated: conversation.escalatedAt !== null,
    createdAt: conversation.createdAt,
    lastActivityAt: conversation.lastActivityAt,
  };
}
