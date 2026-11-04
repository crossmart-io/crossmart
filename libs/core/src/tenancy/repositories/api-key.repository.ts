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

  /** Returns false when the key does not exist in this workspace or is already revoked. */
  async revoke(workspaceId: string, apiKeyId: string, revokedAt: Date): Promise<boolean> {
    const { count } = await this.prisma.apiKey.updateMany({
      where: { id: apiKeyId, workspaceId, revokedAt: null },
      data: { revokedAt },
    });
    return count > 0;
  }

  async markUsed(apiKeyId: string, usedAt: Date): Promise<void> {
    await this.prisma.apiKey.update({ where: { id: apiKeyId }, data: { lastUsedAt: usedAt } });
  }
}
