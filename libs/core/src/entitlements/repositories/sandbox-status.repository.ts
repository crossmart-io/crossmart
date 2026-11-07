import { Injectable } from '@nestjs/common';
import { PrismaService } from '@crossmart/database';
import type { SandboxScope } from '../entities/sandbox-refusal.js';

/** An unclaimed sandbox account, as entitlement checks need it. */
export interface UnclaimedSandbox {
  expiresAt: Date;
}

/** Reads whether a workspace or organization is an unclaimed sandbox account (ADR 0019). */
@Injectable()
export class SandboxStatusRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** One lookup on a unique column; null for every workspace that is not a sandbox. */
  findUnclaimed(scope: SandboxScope): Promise<UnclaimedSandbox | null> {
    return this.prisma.sandboxAccount.findFirst({
      where: { ...scope, claimedAt: null },
      select: { expiresAt: true },
    });
  }

  countProducts(workspaceId: string): Promise<number> {
    return this.prisma.product.count({ where: { workspaceId } });
  }
}
