import { Injectable } from '@nestjs/common';
import { type AskEscalation, type Prisma, PrismaService } from '@crossmart/database';
import { AskEscalationStatus } from '../enums/ask-escalation-status.enum.js';

/** A person's reply to an escalation. */
export interface AskEscalationReply {
  reply: string;
  repliedBy: string;
  repliedAt: Date;
}

const NEWEST_FIRST = 'desc';

/** Escalations to a person. Callers find theirs only by the hash of the ticket id. */
@Injectable()
export class AskEscalationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Opens the escalation and marks its conversation escalated, the first time, together. */
  create(data: Prisma.AskEscalationUncheckedCreateInput, at: Date): Promise<AskEscalation> {
    return this.prisma.$transaction(async (transaction) => {
      const escalation = await transaction.askEscalation.create({ data });
      await transaction.askConversation.updateMany({
        where: { id: data.conversationId, escalatedAt: null },
        data: { escalatedAt: at },
      });
      return escalation;
    });
  }

  findByTokenHash(tokenHash: string): Promise<AskEscalation | null> {
    return this.prisma.askEscalation.findUnique({ where: { tokenHash } });
  }

  findById(id: string): Promise<AskEscalation | null> {
    return this.prisma.askEscalation.findUnique({ where: { id } });
  }

  list(where: Prisma.AskEscalationWhereInput, take: number): Promise<AskEscalation[]> {
    return this.prisma.askEscalation.findMany({
      where,
      orderBy: { createdAt: NEWEST_FIRST },
      take,
    });
  }

  /** Stores the reply once: false when another admin replied first. */
  async saveReply(id: string, reply: AskEscalationReply): Promise<boolean> {
    const { count } = await this.prisma.askEscalation.updateMany({
      where: { id, status: AskEscalationStatus.Open },
      data: { ...reply, status: AskEscalationStatus.Replied },
    });
    return count > 0;
  }

  async saveCallbackResult(
    id: string,
    result: { callbackDeliveredAt: Date | null; callbackError: string | null },
  ): Promise<void> {
    await this.prisma.askEscalation.update({ where: { id }, data: result });
  }
}
