import { Injectable } from '@nestjs/common';
import { type ApiKey, PrismaService, type WorkspaceRole } from '@crossmart/database';
import type { StoredCustomRole } from '../entities/role-assignment.js';
import { CUSTOM_ROLE_SELECT } from './custom-role.repository.js';

export interface ApiKeyRecord {
  workspaceId: string;
  createdById: string;
  name: string;
  role: WorkspaceRole;
  customRoleId: string | null;
  prefix: string;
  hash: string;
  expiresAt?: Date;
}

/** A key with the custom role it may hold, for resolving its permissions. */
export type ApiKeyWithRole = ApiKey & { customRole: StoredCustomRole | null };

@Injectable()
export class ApiKeyRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(record: ApiKeyRecord): Promise<ApiKeyWithRole> {
    return this.prisma.apiKey.create({ data: record, include: CUSTOM_ROLE_SELECT });
  }

  findByHash(hash: string): Promise<ApiKeyWithRole | null> {
    return this.prisma.apiKey.findUnique({ where: { hash }, include: CUSTOM_ROLE_SELECT });
  }

  listActive(workspaceId: string): Promise<ApiKeyWithRole[]> {
    return this.prisma.apiKey.findMany({
      where: { workspaceId, revokedAt: null },
      include: CUSTOM_ROLE_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  listActiveCreatedBy(workspaceId: string, createdById: string): Promise<ApiKeyWithRole[]> {
    return this.prisma.apiKey.findMany({
      where: { workspaceId, createdById, revokedAt: null },
      include: CUSTOM_ROLE_SELECT,
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

  async revokeMany(
    workspaceId: string,
    apiKeyIds: readonly string[],
    revokedAt: Date,
  ): Promise<void> {
    if (apiKeyIds.length === 0) return;
    await this.prisma.apiKey.updateMany({
      where: { id: { in: [...apiKeyIds] }, workspaceId, revokedAt: null },
      data: { revokedAt },
    });
  }

  async markUsed(workspaceId: string, apiKeyId: string, usedAt: Date): Promise<void> {
    await this.prisma.apiKey.updateMany({
      where: { id: apiKeyId, workspaceId },
      data: { lastUsedAt: usedAt },
    });
  }
}
