import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WorkspaceRole } from '@crossmart/database';
import { WorkspacePermission } from '../enums/workspace-permission.enum.js';
import type { CustomRoleRepository } from '../repositories/custom-role.repository.js';
import { RoleResolver } from './role-resolver.js';

function createResolver(found: unknown = null) {
  const customRoles = { find: vi.fn().mockResolvedValue(found) };
  return {
    resolver: new RoleResolver(customRoles as unknown as CustomRoleRepository),
    customRoles,
  };
}

describe('RoleResolver', () => {
  it('resolves a custom role of the same workspace', async () => {
    const { resolver, customRoles } = createResolver({
      id: 'role-1',
      name: 'Stock clerk',
      permissions: [WorkspacePermission.EditInventory],
    });
    const resolved = await resolver.resolve('ws-1', {
      role: WorkspaceRole.CUSTOM,
      customRoleId: 'role-1',
    });
    expect(customRoles.find).toHaveBeenCalledWith('ws-1', 'role-1');
    expect([...resolved.permissions]).toEqual([WorkspacePermission.EditInventory]);
  });

  it('refuses a role id without CUSTOM, CUSTOM without one, and an unknown role', async () => {
    const { resolver } = createResolver();
    await expect(
      resolver.resolve('ws-1', { role: WorkspaceRole.EDITOR, customRoleId: 'role-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(resolver.resolve('ws-1', { role: WorkspaceRole.CUSTOM })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      resolver.resolve('ws-1', { role: WorkspaceRole.CUSTOM, customRoleId: 'role-9' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
