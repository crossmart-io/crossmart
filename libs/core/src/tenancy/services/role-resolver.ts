import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { WorkspaceRole } from '@crossmart/database';
import type { ResolvedRole, RoleAssignment } from '../entities/role-assignment.js';
import { resolveRole } from '../permissions/role-permissions.js';
import { CustomRoleRepository } from '../repositories/custom-role.repository.js';

/** Turns a role someone asks to grant into what it allows, checking a custom role is this workspace's. */
@Injectable()
export class RoleResolver {
  constructor(private readonly customRoles: CustomRoleRepository) {}

  async resolve(workspaceId: string, assignment: RoleAssignment): Promise<ResolvedRole> {
    const customRoleId = assignment.customRoleId ?? null;
    if ((assignment.role === WorkspaceRole.CUSTOM) !== (customRoleId !== null)) {
      throw new BadRequestException('Give customRoleId exactly when the role is CUSTOM');
    }
    if (customRoleId === null) {
      return resolveRole(assignment.role, null);
    }
    const customRole = await this.customRoles.find(workspaceId, customRoleId);
    if (!customRole) {
      throw new NotFoundException('Role not found');
    }
    return resolveRole(assignment.role, customRole);
  }
}
