import { Injectable } from '@nestjs/common';
import { type Prisma, PrismaService } from '@crossmart/database';
import type { SandboxReminder } from '../entities/sandbox-account.js';

type Transaction = Prisma.TransactionClient;

/** An unclaimed sandbox whose time is up. */
function expiredWhere(now: Date): Prisma.SandboxAccountWhereInput {
  return { claimedAt: null, expiresAt: { lte: now } };
}

/**
 * What the hourly sweep reads and writes: reminders due, and expired sandboxes to delete. Each
 * write checks its conditions again, so running the sweep twice changes nothing more.
 */
@Injectable()
export class SandboxSweepRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Unclaimed, unexpired sandboxes first emailed before `sentBefore` and not reminded yet. */
  async findDueReminders(sentBefore: Date, now: Date, limit: number): Promise<SandboxReminder[]> {
    const rows = await this.prisma.sandboxAccount.findMany({
      where: {
        claimedAt: null,
        claimEmailResentAt: null,
        claimEmailSentAt: { lte: sentBefore },
        expiresAt: { gt: now },
      },
      select: {
        id: true,
        expiresAt: true,
        user: { select: { email: true } },
        organization: { select: { name: true } },
      },
      orderBy: { claimEmailSentAt: 'asc' },
      take: limit,
    });
    return rows.map(({ id, expiresAt, user, organization }) => ({
      id,
      expiresAt,
      email: user.email,
      storeName: organization.name,
    }));
  }

  /** Puts the reminder's new link in place, once. False when it was sent or claimed meanwhile. */
  async markReminded(id: string, claimTokenHash: string, now: Date): Promise<boolean> {
    const { count } = await this.prisma.sandboxAccount.updateMany({
      where: { id, claimedAt: null, claimEmailResentAt: null },
      data: { claimTokenHash, claimEmailResentAt: now },
    });
    return count > 0;
  }

  async findExpiredIds(now: Date, limit: number): Promise<string[]> {
    const rows = await this.prisma.sandboxAccount.findMany({
      where: expiredWhere(now),
      select: { id: true },
      orderBy: { expiresAt: 'asc' },
      take: limit,
    });
    return rows.map(({ id }) => id);
  }

  /**
   * Deletes an expired sandbox's organization, with its workspace and everything in it, and then
   * its owner unless they joined another workspace meanwhile. False when it was claimed meanwhile.
   */
  deleteExpired(id: string, now: Date): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const sandbox = await tx.sandboxAccount.findFirst({
        where: { id, ...expiredWhere(now) },
        select: { organizationId: true, userId: true },
      });
      if (!sandbox) return false;
      await tx.organization.delete({ where: { id: sandbox.organizationId } });
      await this.deleteOwnerIfAlone(tx, sandbox.userId);
      return true;
    });
  }

  private async deleteOwnerIfAlone(tx: Transaction, userId: string): Promise<void> {
    const memberships = await tx.workspaceMember.count({ where: { userId } });
    if (memberships === 0) await tx.user.delete({ where: { id: userId } });
  }
}
