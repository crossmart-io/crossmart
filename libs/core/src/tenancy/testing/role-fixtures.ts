import { WorkspaceRole } from '@crossmart/database';
import type { RoleAssignment, StoredCustomRole } from '../entities/role-assignment.js';
import type { MembershipManager } from '../entities/workspace-invitation.js';
import {
  type BuiltInRole,
  builtInPermissions,
  resolveRole,
} from '../permissions/role-permissions.js';
import type { RoleResolver } from '../services/role-resolver.js';

/** A member or key acting with a built-in role, for unit tests. */
export function managerWith(role: BuiltInRole, userId = 'user-1'): MembershipManager {
  return { userId, permissions: builtInPermissions(role) };
}

/** A `RoleResolver` that knows the given custom roles, without a database. */
export function fakeRoleResolver(customRoles: StoredCustomRole[] = []): RoleResolver {
  return {
    resolve: (_workspaceId: string, assignment: RoleAssignment) => {
      const customRole = customRoles.find((role) => role.id === assignment.customRoleId) ?? null;
      return Promise.resolve(
        resolveRole(assignment.role, assignment.role === WorkspaceRole.CUSTOM ? customRole : null),
      );
    },
  } as RoleResolver;
}
