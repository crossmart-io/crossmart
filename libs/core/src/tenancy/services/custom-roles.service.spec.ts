import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceRole } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import { WorkspacePermission } from '../enums/workspace-permission.enum.js';
import type {
  CustomRoleRecord,
  CustomRoleRepository,
} from '../repositories/custom-role.repository.js';
import { MAX_CUSTOM_ROLES } from '../tenancy.constants.js';
import { managerWith } from '../testing/role-fixtures.js';
import type { ApiKeyCleanup } from './api-key-cleanup.js';
import { CustomRolesService } from './custom-roles.service.js';

const ACTOR = Actor.user('user-1');
const ADMIN = managerWith(WorkspaceRole.ADMIN);
const STOCK_CLERK = {
  id: 'role-1',
  name: 'Stock clerk',
  permissions: [WorkspacePermission.ViewWorkspace, WorkspacePermission.EditInventory],
};

function stored(record: CustomRoleRecord, id = 'role-1') {
  return {
    id,
    workspaceId: 'ws-1',
    ...record,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { members: 0 },
  };
}

function createService() {
  const customRoles = {
    list: vi.fn().mockResolvedValue([]),
    find: vi.fn().mockResolvedValue(STOCK_CLERK),
    nameTaken: vi.fn().mockResolvedValue(false),
    create: vi.fn((_workspaceId: string, record: CustomRoleRecord) =>
      Promise.resolve(stored(record)),
    ),
    update: vi.fn((_workspaceId: string, id: string, record: CustomRoleRecord) =>
      Promise.resolve(stored(record, id)),
    ),
    delete: vi.fn(),
    usage: vi.fn().mockResolvedValue({ members: 0, pendingInvitations: 0, activeApiKeys: 0 }),
    memberUserIds: vi.fn().mockResolvedValue(['user-7']),
  };
  const keys = { revokeBeyond: vi.fn() };
  const activity = new InMemoryActivityRecorder();
  const service = new CustomRolesService(
    customRoles as unknown as CustomRoleRepository,
    keys as unknown as ApiKeyCleanup,
    activity,
  );
  return { service, customRoles, keys, activity };
}

describe('CustomRolesService.create', () => {
  it('always lets the role open the workspace and stores permissions in order', async () => {
    const { service, customRoles, activity } = createService();
    const role = await service.create(
      'ws-1',
      ADMIN,
      {
        name: '  Stock clerk ',
        permissions: [WorkspacePermission.EditInventory, WorkspacePermission.ViewInventory],
      },
      ACTOR,
    );
    expect(customRoles.create).toHaveBeenCalledWith('ws-1', {
      name: 'Stock clerk',
      description: null,
      permissions: [
        WorkspacePermission.ViewWorkspace,
        WorkspacePermission.ViewInventory,
        WorkspacePermission.EditInventory,
      ],
    });
    expect(role.name).toBe('Stock clerk');
    expect(activity.entries[0]?.action).toBe(ActivityAction.CustomRoleCreated);
  });

  it('refuses owner-only permissions and more than the manager has', async () => {
    const { service } = createService();
    await expect(
      service.create(
        'ws-1',
        managerWith(WorkspaceRole.OWNER),
        { name: 'Root', permissions: [WorkspacePermission.DeleteWorkspace] },
        ACTOR,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.create(
        'ws-1',
        managerWith(WorkspaceRole.EDITOR),
        { name: 'Boss', permissions: [WorkspacePermission.ManageMembers] },
        ACTOR,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses a taken name and too many roles', async () => {
    const { service, customRoles } = createService();
    const input = { name: 'Stock clerk', permissions: [] };
    customRoles.nameTaken.mockResolvedValueOnce(true);
    await expect(service.create('ws-1', ADMIN, input, ACTOR)).rejects.toBeInstanceOf(
      ConflictException,
    );
    customRoles.list.mockResolvedValueOnce(Array.from({ length: MAX_CUSTOM_ROLES }));
    await expect(service.create('ws-1', ADMIN, input, ACTOR)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

describe('CustomRolesService.update', () => {
  it('keeps the members’ API keys within the changed role', async () => {
    const { service, keys } = createService();
    await service.update(
      'ws-1',
      ADMIN,
      { id: 'role-1', name: 'Stock clerk', permissions: [WorkspacePermission.ViewInventory] },
      ACTOR,
    );
    expect(keys.revokeBeyond).toHaveBeenCalledWith(
      'ws-1',
      'user-7',
      new Set([WorkspacePermission.ViewWorkspace, WorkspacePermission.ViewInventory]),
    );
  });

  it('lets nobody edit a role above their own', async () => {
    const { service, customRoles } = createService();
    customRoles.find.mockResolvedValueOnce({
      ...STOCK_CLERK,
      permissions: [WorkspacePermission.ManageMembers],
    });
    await expect(
      service.update(
        'ws-1',
        managerWith(WorkspaceRole.EDITOR),
        { id: 'role-1', name: 'Stock clerk', permissions: [] },
        ACTOR,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('CustomRolesService.delete', () => {
  it('refuses a role in use, and an unknown one', async () => {
    const { service, customRoles } = createService();
    customRoles.usage.mockResolvedValueOnce({
      members: 2,
      pendingInvitations: 0,
      activeApiKeys: 1,
    });
    await expect(service.delete('ws-1', 'role-1', ACTOR)).rejects.toThrow(
      'Stock clerk is still used by 2 member(s), 1 API key(s). Give them another role first.',
    );
    customRoles.find.mockResolvedValueOnce(null);
    await expect(service.delete('ws-1', 'role-9', ACTOR)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes an unused role', async () => {
    const { service, customRoles, activity } = createService();
    await service.delete('ws-1', 'role-1', ACTOR);
    expect(customRoles.delete).toHaveBeenCalledWith('ws-1', 'role-1');
    expect(activity.entries[0]?.action).toBe(ActivityAction.CustomRoleDeleted);
  });
});
