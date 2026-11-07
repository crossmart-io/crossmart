import { Injectable } from '@nestjs/common';
import { type Prisma, PrismaService } from '@crossmart/database';
import type { ClaimedSandbox, SandboxClaimResult } from '../entities/sandbox-account.js';
import { SandboxClaimOutcome } from '../enums/sandbox-claim-outcome.enum.js';
import { CREDENTIAL_PROVIDER_ID } from '../sandbox.constants.js';
import { claimableWhere, hasPassword, SANDBOX_PREVIEW_SELECT } from './sandbox-account.queries.js';

type Transaction = Prisma.TransactionClient;
type SandboxRow = Prisma.SandboxAccountGetPayload<{ select: typeof SANDBOX_PREVIEW_SELECT }>;

function toClaimed(sandbox: SandboxRow): ClaimedSandbox {
  return {
    workspaceId: sandbox.workspaceId,
    userId: sandbox.userId,
    email: sandbox.user.email,
    storeName: sandbox.organization.name,
  };
}

/**
 * Turns sandbox accounts into normal ones. A claim marks the record claimed in the same
 * transaction that checks it is still unclaimed, so a link works once however often it is sent.
 */
@Injectable()
export class SandboxClaimRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Claims with the link's token, giving the person the password they chose. */
  claimWithPassword(
    claimTokenHash: string,
    passwordHash: string,
    now: Date,
  ): Promise<SandboxClaimResult> {
    return this.prisma.$transaction(async (tx) => {
      const sandbox = await tx.sandboxAccount.findFirst({
        where: claimableWhere(claimTokenHash, now),
        select: SANDBOX_PREVIEW_SELECT,
      });
      if (!sandbox) return { outcome: SandboxClaimOutcome.InvalidLink };
      if (await hasPassword(tx, sandbox.userId)) {
        return { outcome: SandboxClaimOutcome.PasswordAlreadySet };
      }
      if (!(await this.markClaimed(tx, sandbox.id, now))) {
        return { outcome: SandboxClaimOutcome.InvalidLink };
      }
      await this.setPassword(tx, sandbox.userId, passwordHash);
      return { outcome: SandboxClaimOutcome.Claimed, claimed: toClaimed(sandbox) };
    });
  }

  /**
   * Claims for the signed-in owner, who proved the address by signing in (only a password reset
   * link or this claim can give them a password). Null when there is nothing of theirs to claim.
   */
  claimForOwner(workspaceId: string, userId: string, now: Date): Promise<ClaimedSandbox | null> {
    return this.prisma.$transaction(async (tx) => {
      const where = { workspaceId, userId, claimedAt: null, expiresAt: { gt: now } };
      const sandbox = await tx.sandboxAccount.findFirst({ where, select: SANDBOX_PREVIEW_SELECT });
      if (!sandbox || !(await this.markClaimed(tx, sandbox.id, now))) return null;
      await tx.user.update({ where: { id: userId }, data: { emailVerified: true } });
      return toClaimed(sandbox);
    });
  }

  private async markClaimed(tx: Transaction, id: string, now: Date): Promise<boolean> {
    const { count } = await tx.sandboxAccount.updateMany({
      where: { id, claimedAt: null },
      data: { claimedAt: now },
    });
    return count > 0;
  }

  /** The login Better Auth signs in with; the claim link proved the address too. */
  private async setPassword(tx: Transaction, userId: string, passwordHash: string): Promise<void> {
    await tx.account.create({
      data: {
        userId,
        providerId: CREDENTIAL_PROVIDER_ID,
        accountId: userId,
        password: passwordHash,
      },
    });
    await tx.user.update({ where: { id: userId }, data: { emailVerified: true } });
  }
}
