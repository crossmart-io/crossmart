import { Injectable } from '@nestjs/common';
import { isUniqueViolation, type Prisma, PrismaService } from '@crossmart/database';
import { organizationWithOwnerData } from '../../tenancy/repositories/organization.repository.js';
import { DEFAULT_WORKSPACE_NAME } from '../../tenancy/tenancy.constants.js';
import type {
  CreatedSandboxAccount,
  NewSandboxAccount,
  SandboxClaimPreview,
} from '../entities/sandbox-account.js';
import { SANDBOX_AGENT_KEY_ROLE } from '../sandbox.constants.js';
import { claimableWhere, hasPassword, SANDBOX_PREVIEW_SELECT } from './sandbox-account.queries.js';

type Transaction = Prisma.TransactionClient;

/** Opens sandbox accounts and reads them for the claim page. */
@Injectable()
export class SandboxAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** True when any account, sandbox or not, uses the address, whatever its case. */
  async emailHasAccount(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    return count > 0;
  }

  /**
   * The user, organization, workspace, sandbox record and agent key, in one transaction. Null
   * when the address got an account meanwhile, so nothing is created.
   */
  async create(input: NewSandboxAccount): Promise<CreatedSandboxAccount | null> {
    try {
      return await this.prisma.$transaction((tx) => this.createIn(tx, input));
    } catch (error) {
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  }

  async findPreview(claimTokenHash: string, now: Date): Promise<SandboxClaimPreview | null> {
    const sandbox = await this.prisma.sandboxAccount.findFirst({
      where: claimableWhere(claimTokenHash, now),
      select: SANDBOX_PREVIEW_SELECT,
    });
    if (!sandbox) return null;
    return {
      workspaceId: sandbox.workspaceId,
      email: sandbox.user.email,
      storeName: sandbox.organization.name,
      claimExpiresAt: sandbox.expiresAt,
      passwordSet: await hasPassword(this.prisma, sandbox.userId),
    };
  }

  private async createIn(
    tx: Transaction,
    input: NewSandboxAccount,
  ): Promise<CreatedSandboxAccount> {
    const user = await tx.user.create({ data: { email: input.email, name: input.ownerName } });
    const organization = await tx.organization.create({
      data: organizationWithOwnerData({
        organizationName: input.storeName,
        workspaceName: DEFAULT_WORKSPACE_NAME,
        workspaceSlug: input.workspaceSlug,
        ownerId: user.id,
        subscription: input.subscription,
      }),
      select: { id: true, workspaces: { select: { id: true } } },
    });
    const [workspace] = organization.workspaces;
    await tx.sandboxAccount.create({
      data: {
        organizationId: organization.id,
        workspaceId: workspace.id,
        userId: user.id,
        claimTokenHash: input.claimTokenHash,
        expiresAt: input.expiresAt,
        claimEmailSentAt: new Date(),
      },
    });
    const apiKey = await tx.apiKey.create({
      data: {
        workspaceId: workspace.id,
        createdById: user.id,
        role: SANDBOX_AGENT_KEY_ROLE,
        ...input.agentKey,
      },
      select: { id: true },
    });
    return { workspaceId: workspace.id, apiKeyId: apiKey.id };
  }
}
