import { Injectable } from '@nestjs/common';
import {
  type AskConversation,
  type AskTurn,
  type Prisma,
  PrismaService,
} from '@crossmart/database';
import type { AskContextTurn } from '../entities/ask-context.js';

/** A conversation as Ask needs it to continue: who owns it and how far it got. */
export type AskConversationRow = Pick<
  AskConversation,
  'id' | 'publicId' | 'ownerKey' | 'turnCount' | 'lastActivityAt' | 'escalatedAt' | 'channel'
>;

/** A turn with the public id of its conversation, as A2A shows it as a task. */
export type AskTurnWithConversation = AskTurn & { conversation: Pick<AskConversation, 'publicId'> };

/** A new turn, before its position in the conversation is known. */
export type NewAskTurn = Omit<
  Prisma.AskTurnUncheckedCreateInput,
  'id' | 'conversationId' | 'position' | 'createdAt'
>;

const CONVERSATION_FIELDS = {
  id: true,
  publicId: true,
  ownerKey: true,
  turnCount: true,
  lastActivityAt: true,
  escalatedAt: true,
  channel: true,
} as const;
const NEWEST_FIRST = 'desc';

/** Ask Crossmart's conversations and their turns. Every read by a caller checks its owner key. */
@Injectable()
export class AskConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AskConversationUncheckedCreateInput): Promise<AskConversationRow> {
    return this.prisma.askConversation.create({ data, select: CONVERSATION_FIELDS });
  }

  findByPublicId(publicId: string): Promise<AskConversationRow | null> {
    return this.prisma.askConversation.findUnique({
      where: { publicId },
      select: CONVERSATION_FIELDS,
    });
  }

  /** The latest `limit` turns, oldest first, as the model reads them. */
  async recentTurns(conversationId: string, limit: number): Promise<AskContextTurn[]> {
    const turns = await this.prisma.askTurn.findMany({
      where: { conversationId },
      orderBy: { position: NEWEST_FIRST },
      take: limit,
      select: { question: true, answer: true },
    });
    return turns.reverse();
  }

  /**
   * Adds a turn at the next position and moves the conversation's last activity, in one
   * transaction: the counter's row lock orders concurrent questions on one conversation.
   */
  appendTurn(conversationId: string, turn: NewAskTurn, at: Date): Promise<AskTurn> {
    return this.prisma.$transaction(async (transaction) => {
      const { turnCount } = await transaction.askConversation.update({
        where: { id: conversationId },
        data: { turnCount: { increment: 1 }, lastActivityAt: at },
        select: { turnCount: true },
      });
      return transaction.askTurn.create({
        data: { ...turn, conversationId, position: turnCount, createdAt: at },
      });
    });
  }

  /** A turn of one of the owner's conversations; null for anyone else's. */
  findTurnOfOwner(turnId: string, ownerKey: string): Promise<AskTurnWithConversation | null> {
    return this.prisma.askTurn.findFirst({
      where: { id: turnId, conversation: { ownerKey } },
      include: { conversation: { select: { publicId: true } } },
    });
  }

  /** The owner's turns, newest first, in one conversation or all of theirs. */
  listTurnsOfOwner(
    ownerKey: string,
    filter: { publicId?: string; cursor?: string; take: number },
  ): Promise<AskTurnWithConversation[]> {
    const { publicId, cursor, take } = filter;
    return this.prisma.askTurn.findMany({
      where: { conversation: { ownerKey, ...(publicId ? { publicId } : {}) } },
      include: { conversation: { select: { publicId: true } } },
      orderBy: { id: NEWEST_FIRST },
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  /** How many turns the owner has, in one conversation or all of theirs. */
  countTurnsOfOwner(ownerKey: string, publicId?: string): Promise<number> {
    return this.prisma.askTurn.count({
      where: { conversation: { ownerKey, ...(publicId ? { publicId } : {}) } },
    });
  }

  /** Deletes up to `limit` conversations idle since before `cutoff`, with their turns. */
  deleteIdleBefore(cutoff: Date, limit: number): Promise<number> {
    return this.prisma.$executeRaw`
      DELETE FROM ask_conversations
      WHERE id IN (
        SELECT id FROM ask_conversations
        WHERE last_activity_at < ${cutoff}
        LIMIT ${limit}
      )`;
  }
}
