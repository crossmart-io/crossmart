import { Injectable } from '@nestjs/common';
import type { WorkspacePermission } from '../enums/workspace-permission.enum.js';
import { permissionsCover, resolveRole } from '../permissions/role-permissions.js';
import { ApiKeyRepository } from '../repositories/api-key.repository.js';

/**
 * Keeps API keys within their creator's access: a key never allows more than the person who made
 * it, even after that person is demoted, their role is narrowed, or they leave.
 */
@Injectable()
export class ApiKeyCleanup {
  constructor(private readonly apiKeys: ApiKeyRepository) {}

  /** Revokes the creator's keys here that allow more than `permissions`; all of them when null. */
  async revokeBeyond(
    workspaceId: string,
    createdById: string,
    permissions: ReadonlySet<WorkspacePermission> | null,
  ): Promise<void> {
    const keys = await this.apiKeys.listActiveCreatedBy(workspaceId, createdById);
    const excess = keys.filter(
      (key) =>
        permissions === null ||
        !permissionsCover(permissions, resolveRole(key.role, key.customRole).permissions),
    );
    await this.apiKeys.revokeMany(
      workspaceId,
      excess.map((key) => key.id),
      new Date(),
    );
  }
}
