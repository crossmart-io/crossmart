import { Injectable } from '@nestjs/common';
import { type CountedRecords, toPageWindow } from '@crossmart/common';
import {
  type AskConversation,
  type AskEscalation,
  type AskTurn,
  type Prisma,
  PrismaService,
} from '@crossmart/database';
import type {
  AskConversationQuery,
  AskQuestionCount,
  AskQuestionCountQuery,
} from '../entities/ask-records.js';

/** A conversation with every turn and escalation, for the admin view. */
export type AskConversationWithTurns = AskConversation & {
  turns: AskTurn[];
  escalations: AskEscalation[];
};

/** The first or latest turn of a listed conversation. */
export type ConversationEndTurn = Pick<
  AskTurn,
  'conversationId' | 'position' | 'question' | 'outcome'
>;

const NEWEST_FIRST = 'desc';
const OLDEST_FIRST = 'asc';
const FIRST_POSITION = 1;

function createdBetween(from?: Date, to?: Date): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined;
  return { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
}

function conversationWhere(query: AskConversationQuery): Prisma.AskConversationWhereInput {
  const { outcome, channel, escalated, from, to } = query;
  return {
    ...(channel ? { channel } : {}),
    ...(outcome ? { turns: { some: { outcome } } } : {}),
    ...(escalated === undefined ? {} : { escalatedAt: escalated ? { not: null } : null }),
    ...(from || to ? { createdAt: createdBetween(from, to) } : {}),
  };
}

/** The platform admins' reads of Ask Crossmart's stored conversations. Never tenant-scoped. */
@Injectable()
export class AskInsightsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listConversations(query: AskConversationQuery): Promise<CountedRecords<AskConversation>> {
    const where = conversationWhere(query);
    const [records, total] = await Promise.all([
      this.prisma.askConversation.findMany({
        where,
        orderBy: { id: NEWEST_FIRST },
        ...toPageWindow(query),
      }),
      this.prisma.askConversation.count({ where }),
    ]);
    return { records, total };
  }

  /** The first and latest turn of each conversation, in one query. */
  endTurns(conversations: readonly AskConversation[]): Promise<ConversationEndTurn[]> {
    if (!conversations.length) return Promise.resolve([]);
    return this.prisma.askTurn.findMany({
      where: {
        OR: conversations.map(({ id, turnCount }) => ({
          conversationId: id,
          position: { in: [FIRST_POSITION, turnCount] },
        })),
      },
      select: { conversationId: true, position: true, question: true, outcome: true },
    });
  }

  findConversation(id: string): Promise<AskConversationWithTurns | null> {
    return this.prisma.askConversation.findUnique({
      where: { id },
      include: {
        turns: { orderBy: { position: OLDEST_FIRST } },
        escalations: { orderBy: { createdAt: OLDEST_FIRST } },
      },
    });
  }

  /** Questions asked alike (same normalised hash), most asked first. */
  async questionCounts(
    where: Prisma.AskTurnWhereInput,
    query: AskQuestionCountQuery,
  ): Promise<AskQuestionCount[]> {
    const createdAt = createdBetween(query.from, query.to);
    const groups = await this.prisma.askTurn.groupBy({
      by: ['questionHash'],
      where: { ...where, ...(createdAt ? { createdAt } : {}) },
      _count: { _all: true },
      _max: { question: true, createdAt: true },
      orderBy: { _count: { questionHash: NEWEST_FIRST } },
      take: query.limit,
    });
    return groups.map((group) => ({
      question: group._max.question ?? '',
      count: group._count._all,
      lastAskedAt: group._max.createdAt ?? new Date(0),
    }));
  }
}
