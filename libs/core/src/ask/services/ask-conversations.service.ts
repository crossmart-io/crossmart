import { Injectable } from '@nestjs/common';
import { constantTimeEquals } from '@crossmart/common';
import {
  ASK_CONTEXT_MAX_TURNS,
  ASK_CONVERSATION_IDLE_MS,
  ASK_CONVERSATION_MAX_TURNS,
} from '../ask.constants.js';
import type { AskCaller } from '../entities/ask-caller.js';
import type { AskContextTurn } from '../entities/ask-context.js';
import type { AskEscalationOffer } from '../entities/ask-reply.js';
import type { AskRequest } from '../entities/ask-request.js';
import type { ComposedAnswer } from '../entities/composed-answer.js';
import { AskConversationFullError, AskConversationNotFoundError } from '../errors/ask.errors.js';
import {
  type AskConversationRow,
  AskConversationRepository,
  type AskTurnWithConversation,
  type NewAskTurn,
} from '../repositories/ask-conversation.repository.js';
import { newConversationToken } from '../rules/ask-tokens.js';
import { boundedContext } from '../rules/conversation-context.js';
import { questionHash } from '../rules/question-hash.js';
import { redactSecrets } from '../rules/redact-secrets.js';

/** The conversation a question belongs to: an existing one, or none yet for a first question. */
export interface OpenedConversation {
  existing: AskConversationRow | null;
  /** The earlier turns the model reads, bounded. */
  history: AskContextTurn[];
}

/** A turn as it was stored, with what the caller continues the conversation with. */
export interface RecordedTurn {
  conversationId: string;
  turnId: string;
}

/** How a turn came about, to store with it. */
export interface TurnOutcome {
  composed: ComposedAnswer;
  offer: AskEscalationOffer;
  latencyMs: number;
}

/**
 * Ask Crossmart's conversations (ADR 0025): continues one only for the caller it is bound to
 * and before it expires, and stores every question and answer, redacted, for the team to read.
 */
@Injectable()
export class AskConversationsService {
  constructor(private readonly conversations: AskConversationRepository) {}

  /** The conversation to continue and its recent turns; throws 404 for anyone else's. */
  async open(request: AskRequest, now: Date): Promise<OpenedConversation> {
    if (!request.conversationId) return { existing: null, history: [] };
    const existing = await this.requireOwned(request.conversationId, request.caller, now);
    if (existing.turnCount >= ASK_CONVERSATION_MAX_TURNS) throw new AskConversationFullError();
    const turns = await this.conversations.recentTurns(existing.id, ASK_CONTEXT_MAX_TURNS);
    return { existing, history: boundedContext(turns) };
  }

  /**
   * The caller's live conversation with this id. One that does not exist, expired, or belongs
   * to someone else is the same 404, so an id leaks nothing.
   */
  async requireOwned(publicId: string, caller: AskCaller, now: Date): Promise<AskConversationRow> {
    const conversation = await this.conversations.findByPublicId(publicId);
    const live =
      conversation &&
      constantTimeEquals(conversation.ownerKey, caller.ownerKey) &&
      now.getTime() - conversation.lastActivityAt.getTime() < ASK_CONVERSATION_IDLE_MS;
    if (!live) throw new AskConversationNotFoundError();
    return conversation;
  }

  /** Stores the turn, starting the conversation on its first question. */
  async record(
    request: AskRequest,
    opened: OpenedConversation,
    outcome: TurnOutcome,
    now: Date,
  ): Promise<RecordedTurn> {
    const conversation = opened.existing ?? (await this.start(request, now));
    const turn = await this.conversations.appendTurn(
      conversation.id,
      this.turnData(request.question, outcome),
      now,
    );
    return { conversationId: conversation.publicId, turnId: turn.id };
  }

  /** One of the caller's turns, for A2A `GetTask`; null for anyone else's. */
  findTurn(turnId: string, caller: AskCaller): Promise<AskTurnWithConversation | null> {
    return this.conversations.findTurnOfOwner(turnId, caller.ownerKey);
  }

  /** The caller's turns, newest first, for A2A `ListTasks`. */
  listTurns(
    caller: AskCaller,
    filter: { conversationId?: string; cursor?: string; take: number },
  ): Promise<AskTurnWithConversation[]> {
    return this.conversations.listTurnsOfOwner(caller.ownerKey, {
      publicId: filter.conversationId,
      cursor: filter.cursor,
      take: filter.take,
    });
  }

  /** How many turns the caller has, for A2A `ListTasks`. */
  countTurns(caller: AskCaller, conversationId?: string): Promise<number> {
    return this.conversations.countTurnsOfOwner(caller.ownerKey, conversationId);
  }

  private start(request: AskRequest, now: Date): Promise<AskConversationRow> {
    const { caller } = request;
    return this.conversations.create({
      publicId: newConversationToken(),
      channel: request.channel,
      callerType: caller.type,
      clientName: caller.clientName,
      ownerKey: caller.ownerKey,
      clientFingerprint: caller.clientFingerprint,
      workspaceId: caller.workspace?.workspaceId ?? null,
      userId: caller.userId,
      lastActivityAt: now,
      createdAt: now,
    });
  }

  private turnData(question: string, { composed, offer, latencyMs }: TurnOutcome): NewAskTurn {
    const redacted = redactSecrets(question);
    const { answer } = composed;
    return {
      question: redacted,
      questionHash: questionHash(redacted),
      answer: redactSecrets(answer.answer),
      outcome: answer.outcome,
      confidence: answer.confidence,
      citations: answer.citations.map(({ title, url }) => ({ title, url })),
      accountLookups: composed.lookups,
      escalationReason: offer.reason,
      latencyMs,
      model: composed.model,
      cached: composed.cached,
    };
  }
}
