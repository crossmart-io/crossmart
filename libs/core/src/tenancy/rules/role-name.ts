import type { CustomRoleRef } from '../entities/role-assignment.js';
import type { WorkspaceRole } from '@crossmart/database';
import { WORKSPACE_ROLE_NAMES } from '../tenancy.constants.js';

/** A role as people read it: the custom role's own name, or the built-in role's. */
export function roleName(held: { role: WorkspaceRole; customRole: CustomRoleRef | null }): string {
  return held.customRole?.name ?? WORKSPACE_ROLE_NAMES[held.role];
}
