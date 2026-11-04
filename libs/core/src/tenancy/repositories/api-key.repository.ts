import { Injectable } from '@nestjs/common';
import { type ApiKey, PrismaService, type WorkspaceRole } from '@crossmart/database';

export interface ApiKeyRecord {
  workspaceId: string;
  createdById: string;
  name: string;
  role: WorkspaceRole;
  prefix: string;
  hash: string;
  expiresAt?: Date;
}

@Injectable()
export class ApiKeyRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(record: ApiKeyRecord): Promise<ApiKey> {
    return this.prisma.apiKey.create({ data: record });
  }

  findByHash(hash: string): Promise<ApiKey | null> {
    return this.prisma.apiKey.findUnique({ where: { hash } });
  }

  listActive(workspaceId: string): Promise<ApiKey[]> {
    return this.prisma.apiKey.findMany({
      where: { workspaceId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Returns the revoked key, or null when it is not in this workspace or already revoked. */
  async revoke(
    workspaceId: string,
    apiKeyId: string,
    revokedAt: Date,
  ): Promise<Pick<ApiKey, 'id' | 'name'> | null> {
    const where = { id: apiKeyId, workspaceId, revokedAt: null };
    const apiKey = await this.prisma.apiKey.findFirst({ where, select: { id: true, name: true } });
    if (!apiKey) return null;
    const { count } = await this.prisma.apiKey.updateMany({ where, data: { revokedAt } });
    return count > 0 ? apiKey : null;
  }

  async markUsed(apiKeyId: string, usedAt: Date): Promise<void> {
    await this.prisma.apiKey.update({ where: { id: apiKeyId }, data: { lastUsedAt: usedAt } });
  }

  /** Revokes the active keys a user created here, only those with `roles` when given. */
  async revokeCreatedBy(
    workspaceId: string,
    createdById: string,
    revokedAt: Date,
    roles?: readonly WorkspaceRole[],
  ): Promise<void> {
    await this.prisma.apiKey.updateMany({
      where: {
        workspaceId,
        createdById,
        revokedAt: null,
        ...(roles ? { role: { in: [...roles] } } : {}),
      },
      data: { revokedAt },
    });
  }
}
