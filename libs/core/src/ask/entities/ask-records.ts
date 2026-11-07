import type { AccountLookupKind } from '../enums/account-lookup-kind.enum.js';
import type { AskCallerType } from '../enums/ask-caller-type.enum.js';
import type { AskChannel } from '../enums/ask-channel.enum.js';
import type { AskConfidence } from '../enums/ask-confidence.enum.js';
import type { AskEscalationReason } from '../enums/ask-escalation-reason.enum.js';
import type { AskEscalationStatus } from '../enums/ask-escalation-status.enum.js';
import type { AskOutcome } from '../enums/ask-outcome.enum.js';
import type { AskCitation } from './ask-answer.js';

/** A conversation as the platform admins see it in a list. */
export interface AskConversationSummary {
  id: string;
  channel: AskChannel;
  callerType: AskCallerType;
  clientName: string | null;
  workspaceId: string | null;
  turnCount: number;
  /** The first question, redacted. */
  firstQuestion: string | null;
  /** The outcome of the latest turn. */
  lastOutcome: AskOutcome | null;
  escalated: boolean;
  createdAt: Date;
  lastActivityAt: Date;
}

/** One stored question and answer. */
export interface AskTurnRecord {
  id: string;
  position: number;
  question: string;
  answer: string;
  outcome: AskOutcome;
  confidence: AskConfidence;
  citations: AskCitation[];
  accountLookups: AccountLookupKind[];
  escalationReason: AskEscalationReason | null;
  latencyMs: number;
  model: string | null;
  cached: boolean;
  createdAt: Date;
}

/** An escalation as the platform admins see it. The ticket id is never shown again. */
export interface AskEscalationRecord {
  id: string;
  conversationId: string;
  reason: AskEscalationReason;
  status: AskEscalationStatus;
  contactEmail: string | null;
  callbackUrl: string | null;
  reply: string | null;
  repliedAt: Date | null;
  repliedBy: string | null;
  callbackDeliveredAt: Date | null;
  callbackError: string | null;
  createdAt: Date;
}

/** A conversation with every turn and escalation, for the admin conversation view. */
export interface AskConversationDetail extends AskConversationSummary {
  turns: AskTurnRecord[];
  escalations: AskEscalationRecord[];
}

/** Questions asked alike, counted: what people ask most, or what Ask could not answer. */
export interface AskQuestionCount {
  /** One of the questions, redacted. */
  question: string;
  count: number;
  lastAskedAt: Date;
}

/** The filters of the admin conversation list. Absent ones are not applied. */
export interface AskConversationQuery {
  /** Conversations with at least one turn of this outcome. */
  outcome?: AskOutcome;
  channel?: AskChannel;
  escalated?: boolean;
  from?: Date;
  to?: Date;
  cursor?: string;
  page?: number;
  limit: number;
}

export interface AskConversationPage {
  items: AskConversationSummary[];
  nextCursor: string | null;
  total: number;
}

/** The period the question counts cover, and how many to return. */
export interface AskQuestionCountQuery {
  from?: Date;
  to?: Date;
  limit: number;
}

/** What the asking agent or person sees when they poll an escalation with its ticket id. */
export interface AskEscalationTicket {
  id: string;
  status: AskEscalationStatus;
  reason: AskEscalationReason;
  reply: string | null;
  repliedAt: Date | null;
  createdAt: Date;
}

/** A new escalation: the ticket id (shown once) and the secret its callback is signed with. */
export interface OpenedAskEscalation extends AskEscalationTicket {
  /** Null when no callback URL was given. */
  callbackSecret: string | null;
}

/** What a caller sends to reach a person. */
export interface AskEscalationInput {
  conversationId: string;
  contactEmail?: string;
  callbackUrl?: string;
  /** Why; defaults to what Ask offered, else `human_requested`. */
  reason?: AskEscalationReason;
}
