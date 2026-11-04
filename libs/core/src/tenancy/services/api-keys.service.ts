import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { generateSecureToken, hashSecret } from '@crossmart/common';
import type { ApiKey } from '@crossmart/database';
import type { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type {
  ApiKeyIdentity,
  ApiKeySummary,
  IssuedApiKey,
  NewApiKey,
} from '../entities/api-key-identity.js';
import type { MembershipManager } from '../entities/workspace-invitation.js';
import { permissionsCover, resolveRole } from '../permissions/role-permissions.js';
import { ApiKeyRepository, type ApiKeyWithRole } from '../repositories/api-key.repository.js';
import {
  API_KEY_ASSIGNABLE_ROLES,
  API_KEY_LAST_USED_THROTTLE_MS,
  API_KEY_SECRET_BYTES,
  API_KEY_TOKEN_PREFIX,
  API_KEY_VISIBLE_PREFIX_LENGTH,
} from '../tenancy.constants.js';
import { RoleResolver } from './role-resolver.js';

/** Workspace API keys for the REST API and the MCP server. Only hashes are stored. */
@Injectable()
export class ApiKeysService {
  constructor(
    private readonly apiKeys: ApiKeyRepository,
    private readonly roles: RoleResolver,
    private readonly activity: ActivityRecorder,
  ) {}

  /** The issuer's permissions cap the key's; `actor` is who the activity log credits. */
  async issue(
    workspaceId: string,
    issuer: MembershipManager,
    request: NewApiKey,
    actor: Actor,
  ): Promise<IssuedApiKey> {
    await this.assertAssignable(workspaceId, issuer, request);
    const secret = `${API_KEY_TOKEN_PREFIX}${generateSecureToken(API_KEY_SECRET_BYTES)}`;
    const apiKey = await this.apiKeys.create({
      workspaceId,
      createdById: issuer.userId,
      name: request.name,
      role: request.role,
      customRoleId: request.customRoleId ?? null,
      prefix: secret.slice(0, API_KEY_VISIBLE_PREFIX_LENGTH),
      hash: hashSecret(secret),
      expiresAt: request.expiresAt,
    });
    await this.recordChange(workspaceId, actor, ActivityAction.ApiKeyCreated, apiKey);
    return { apiKey: this.toSummary(apiKey), secret };
  }

  async list(workspaceId: string): Promise<ApiKeySummary[]> {
    const apiKeys = await this.apiKeys.listActive(workspaceId);
    return apiKeys.map((apiKey) => this.toSummary(apiKey));
  }

  async revoke(workspaceId: string, apiKeyId: string, actor: Actor): Promise<void> {
    const revoked = await this.apiKeys.revoke(workspaceId, apiKeyId, new Date());
    if (!revoked) {
      throw new NotFoundException('API key not found');
    }
    await this.recordChange(workspaceId, actor, ActivityAction.ApiKeyRevoked, revoked);
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
      createdById: apiKey.createdById,
      ...resolveRole(apiKey.role, apiKey.customRole),
    };
  }

  private async assertAssignable(
    workspaceId: string,
    issuer: MembershipManager,
    request: NewApiKey,
  ): Promise<void> {
    if (!API_KEY_ASSIGNABLE_ROLES.includes(request.role)) {
      throw new ForbiddenException(`API keys cannot have the ${request.role} role`);
    }
    const { permissions } = await this.roles.resolve(workspaceId, request);
    if (!permissionsCover(issuer.permissions, permissions)) {
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

  /** Only the key's id and name are logged, never its secret or hash. */
  private recordChange(
    workspaceId: string,
    actor: Actor,
    action: ActivityAction,
    apiKey: Pick<ApiKey, 'id' | 'name'>,
  ): Promise<void> {
    return this.activity.record(workspaceId, actor, {
      action,
      subject: { type: ActivitySubjectType.ApiKey, id: apiKey.id, label: apiKey.name },
    });
  }

  private toSummary(apiKey: ApiKeyWithRole): ApiKeySummary {
    const { customRole } = resolveRole(apiKey.role, apiKey.customRole);
    return {
      id: apiKey.id,
      name: apiKey.name,
      role: apiKey.role,
      customRole,
      prefix: apiKey.prefix,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }
}
