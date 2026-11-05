import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { WorkspaceRole } from '@crossmart/database';
import { WorkspacePermission } from '../enums/workspace-permission.enum.js';
import { resolveRole } from '../permissions/role-permissions.js';
import type { WorkspaceMemberRepository } from '../repositories/workspace-member.repository.js';
import type { WorkspaceRepository } from '../repositories/workspace.repository.js';
import { WorkspaceAccessService } from './workspace-access.service.js';

function setup(roles: WorkspaceRole[]) {
  const members = {
    findRolesInOrganization: vi
      .fn<WorkspaceMemberRepository['findRolesInOrganization']>()
      .mockResolvedValue(roles.map((role) => resolveRole(role, null))),
  };
  const service = new WorkspaceAccessService(
    members as unknown as WorkspaceMemberRepository,
    {} as WorkspaceRepository,
  );
  return { service, members };
}

describe('WorkspaceAccessService.assertOrganizationPermission', () => {
  const assertBilling = (service: WorkspaceAccessService) =>
    service.assertOrganizationPermission('org-1', 'user-1', WorkspacePermission.ViewBilling);

  it('lets owners and admins of any workspace in the organization see its plan', async () => {
    for (const role of [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]) {
      await expect(assertBilling(setup([WorkspaceRole.VIEWER, role]).service)).resolves.toBe(
        undefined,
      );
    }
  });

  it('refuses other members with 403, and outsiders with 404', async () => {
    await expect(assertBilling(setup([WorkspaceRole.EDITOR]).service)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(assertBilling(setup([]).service)).rejects.toBeInstanceOf(NotFoundException);
  });
});
