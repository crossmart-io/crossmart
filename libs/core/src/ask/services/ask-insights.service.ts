import { Injectable, NotFoundException } from '@nestjs/common';
import { toCountedPage } from '@crossmart/common';
import type { AskConversation } from '@crossmart/database';
import { ASK_CONVERSATION_NOT_FOUND } from '../ask.constants.js';
import type {
  AskConversationDetail,
  AskConversationPage,
  AskConversationQuery,
  AskQuestionCount,
  AskQuestionCountQuery,
} from '../entities/ask-records.js';
import { AskConfidence } from '../enums/ask-confidence.enum.js';
import { AskOutcome } from '../enums/ask-outcome.enum.js';
import {
  toConversationSummary,
  toEscalationRecord,
  toTurnRecord,
} from '../mappers/ask-records.mapper.js';
import {
  AskInsightsRepository,
  type ConversationEndTurn,
} from '../repositories/ask-insights.repository.js';

const FIRST_POSITION = 1;

/** The first and latest turn of each conversation, by conversation id. */
function endsByConversation(
  conversations: readonly AskConversation[],
  turns: readonly ConversationEndTurn[],
): Map<string, { first: ConversationEndTurn | null; last: ConversationEndTurn | null }> {
  const counts = new Map(conversations.map(({ id, turnCount }) => [id, turnCount]));
  const ends = new Map<
    string,
    { first: ConversationEndTurn | null; last: ConversationEndTurn | null }
  >();
  for (const turn of turns) {
    const current = ends.get(turn.conversationId) ?? { first: null, last: null };
    if (turn.position === FIRST_POSITION) current.first = turn;
    if (turn.position === counts.get(turn.conversationId)) current.last = turn;
    ends.set(turn.conversationId, current);
  }
  return ends;
}

/**
 * What the platform admins read about Ask Crossmart (ADR 0025): the stored conversations, the
 * questions asked most, and the ones it could not answer, which are the docs to write next.
 */
@Injectable()
export class AskInsightsService {
  constructor(private readonly insights: AskInsightsRepository) {}

  async conversations(query: AskConversationQuery): Promise<AskConversationPage> {
    const { rows, nextCursor, total } = toCountedPage(
      await this.insights.listConversations(query),
      query.limit,
    );
    const ends = endsByConversation(rows, await this.insights.endTurns(rows));
    const items = rows.map((row) =>
      toConversationSummary(row, ends.get(row.id) ?? { first: null, last: null }),
    );
    return { items, nextCursor, total };
  }

  async conversation(id: string): Promise<AskConversationDetail> {
    const conversation = await this.insights.findConversation(id);
    if (!conversation) throw new NotFoundException(ASK_CONVERSATION_NOT_FOUND);
    const { turns, escalations } = conversation;
    return {
      ...toConversationSummary(conversation, {
        first: turns[0] ?? null,
        last: turns.at(-1) ?? null,
      }),
      turns: turns.map(toTurnRecord),
      escalations: escalations.map(toEscalationRecord),
    };
  }

  /** The questions asked most, whatever the answer. */
  topQuestions(query: AskQuestionCountQuery): Promise<AskQuestionCount[]> {
    return this.insights.questionCounts({}, query);
  }

  /** The questions Ask did not answer, or answered unsure, most asked first. */
  unansweredQuestions(query: AskQuestionCountQuery): Promise<AskQuestionCount[]> {
    return this.insights.questionCounts(
      { OR: [{ outcome: AskOutcome.Unknown }, { confidence: AskConfidence.Low }] },
      query,
    );
  }
}
