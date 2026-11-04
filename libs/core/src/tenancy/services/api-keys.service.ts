import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { generateSecureToken, hashSecret } from '@crossmart/common';
import type { ApiKey, WorkspaceRole } from '@crossmart/database';
import type {
  ApiKeyIdentity,
  ApiKeySummary,
  IssuedApiKey,
  NewApiKey,
} from '../entities/api-key-identity.js';
import { roleCovers } from '../permissions/role-permissions.js';
import { ApiKeyRepository } from '../repositories/api-key.repository.js';
import {
  API_KEY_ASSIGNABLE_ROLES,
  API_KEY_LAST_USED_THROTTLE_MS,
  API_KEY_SECRET_BYTES,
  API_KEY_TOKEN_PREFIX,
  API_KEY_VISIBLE_PREFIX_LENGTH,
} from '../tenancy.constants.js';

export interface ApiKeyIssuer {
  userId: string;
  role: WorkspaceRole;
}

/** Workspace API keys for the REST API and the MCP server. Only hashes are stored. */
@Injectable()
export class ApiKeysService {
  constructor(private readonly apiKeys: ApiKeyRepository) {}

  async issue(
    workspaceId: string,
    issuer: ApiKeyIssuer,
    request: NewApiKey,
  ): Promise<IssuedApiKey> {
    this.assertAssignable(issuer.role, request.role);
    const secret = `${API_KEY_TOKEN_PREFIX}${generateSecureToken(API_KEY_SECRET_BYTES)}`;
    const apiKey = await this.apiKeys.create({
      workspaceId,
      createdById: issuer.userId,
      name: request.name,
      role: request.role,
      prefix: secret.slice(0, API_KEY_VISIBLE_PREFIX_LENGTH),
      hash: hashSecret(secret),
      expiresAt: request.expiresAt,
    });
    return { apiKey: this.toSummary(apiKey), secret };
  }

  async list(workspaceId: string): Promise<ApiKeySummary[]> {
    const apiKeys = await this.apiKeys.listActive(workspaceId);
    return apiKeys.map((apiKey) => this.toSummary(apiKey));
  }

  async revoke(workspaceId: string, apiKeyId: string): Promise<void> {
    const revoked = await this.apiKeys.revoke(workspaceId, apiKeyId, new Date());
    if (!revoked) {
      throw new NotFoundException('API key not found');
    }
  }

  /** Resolves a presented secret to its key, or null when it is unknown, revoked or expired. */
  async authenticate(secret: string, now = new Date()): Promise<ApiKeyIdentity | null> {
    if (!secret.startsWith(API_KEY_TOKEN_PREFIX)) {
      return null;
    }
    const apiKey = await this.apiKeys.findByHash(hashSecret(secret));
    if (!apiKey || !this.isUsable(apiKey, now)) {
      return null;
    }
    await this.recordUse(apiKey, now);
    return {
      apiKeyId: apiKey.id,
      workspaceId: apiKey.workspaceId,
      role: apiKey.role,
      createdById: apiKey.createdById,
    };
  }

  private assertAssignable(issuerRole: WorkspaceRole, requestedRole: WorkspaceRole): void {
    if (!API_KEY_ASSIGNABLE_ROLES.includes(requestedRole)) {
      throw new ForbiddenException(`API keys cannot have the ${requestedRole} role`);
    }
    if (!roleCovers(issuerRole, requestedRole)) {
      throw new ForbiddenException('An API key cannot have more access than its creator');
    }
  }

  private isUsable(apiKey: ApiKey, now: Date): boolean {
    const isExpired = apiKey.expiresAt !== null && apiKey.expiresAt <= now;
    return apiKey.revokedAt === null && !isExpired;
  }

  private async recordUse(apiKey: ApiKey, now: Date): Promise<void> {
    const lastUsedAt = apiKey.lastUsedAt?.getTime() ?? 0;
    if (now.getTime() - lastUsedAt >= API_KEY_LAST_USED_THROTTLE_MS) {
      await this.apiKeys.markUsed(apiKey.id, now);
    }
  }

  private toSummary(apiKey: ApiKey): ApiKeySummary {
    return {
      id: apiKey.id,
      name: apiKey.name,
      role: apiKey.role,
      prefix: apiKey.prefix,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }
}
