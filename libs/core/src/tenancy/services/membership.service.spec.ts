import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { WorkspaceRole } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import type { WorkspaceMemberProfile } from '../entities/workspace-access.js';
import {
  builtInPermissions,
  type BuiltInRole,
  resolveRole,
} from '../permissions/role-permissions.js';
import { fakeRoleResolver, managerWith } from '../testing/role-fixtures.js';
import type { ApiKeyCleanup } from './api-key-cleanup.js';
import type { WorkspaceMemberRepository } from '../repositories/workspace-member.repository.js';
import { MembershipService } from './membership.service.js';

const ACTOR = Actor.user('user-1');
const OWNER = managerWith(WorkspaceRole.OWNER);
const ADMIN = managerWith(WorkspaceRole.ADMIN);

function member(role: BuiltInRole): WorkspaceMemberProfile {
  return {
    userId: 'user-2',
    name: 'Bo',
    email: 'bo@example.com',
    joinedAt: new Date(),
    ...resolveRole(role, null),
  };
}

function createService(target: WorkspaceMemberProfile | null, owners = 1) {
  const members = {
    findMember: vi.fn().mockResolvedValue(target),
    countOwners: vi.fn().mockResolvedValue(owners),
    countMemberships: vi.fn().mockResolvedValue(2),
    updateRole: vi.fn(),
    remove: vi.fn(),
  };
  const keys = { revokeBeyond: vi.fn() };
  const activity = new InMemoryActivityRecorder();
  const service = new MembershipService(
    members as unknown as WorkspaceMemberRepository,
    fakeRoleResolver(),
    keys as unknown as ApiKeyCleanup,
    activity,
  );
  return { service, members, keys, activity };
}

describe('MembershipService.changeRole', () => {
  it('changes the role and revokes keys the new role could not have issued', async () => {
    const { service, members, keys, activity } = createService(member(WorkspaceRole.ADMIN));

    const changed = await service.changeRole(
      'ws-1',
      OWNER,
      { userId: 'user-2', role: WorkspaceRole.EDITOR },
      ACTOR,
    );

    expect(changed.role).toBe(WorkspaceRole.EDITOR);
    expect(members.updateRole).toHaveBeenCalledWith('ws-1', 'user-2', {
      role: WorkspaceRole.EDITOR,
      customRoleId: null,
    });
    expect(keys.revokeBeyond).toHaveBeenCalledWith(
      'ws-1',
      'user-2',
      builtInPermissions(WorkspaceRole.EDITOR),
    );
    expect(activity.entries[0]).toMatchObject({
      action: ActivityAction.MemberRoleChanged,
      detail: 'now Editor',
    });
  });

  it('lets an admin neither touch an owner nor make one', async () => {
    const toOwner = { userId: 'user-2', role: WorkspaceRole.OWNER };
    await expect(
      createService(member(WorkspaceRole.EDITOR)).service.changeRole('ws-1', ADMIN, toOwner, ACTOR),
    ).rejects.toBeInstanceOf(ForbiddenException);
    const toViewer = { userId: 'user-2', role: WorkspaceRole.VIEWER };
    await expect(
      createService(member(WorkspaceRole.OWNER)).service.changeRole('ws-1', ADMIN, toViewer, ACTOR),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('keeps the last owner', async () => {
    const { service, members } = createService(member(WorkspaceRole.OWNER), 1);
    await expect(
      service.changeRole('ws-1', OWNER, { userId: 'user-2', role: WorkspaceRole.ADMIN }, ACTOR),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(members.updateRole).not.toHaveBeenCalled();
  });
});

describe('MembershipService.remove and leave', () => {
  it('removes a member and revokes all their keys', async () => {
    const { service, members, keys, activity } = createService(member(WorkspaceRole.EDITOR));
    await service.remove('ws-1', ADMIN, 'user-2', ACTOR);
    expect(members.remove).toHaveBeenCalledWith('ws-1', 'user-2');
    expect(keys.revokeBeyond).toHaveBeenCalledWith('ws-1', 'user-2', null);
    expect(activity.entries[0]?.action).toBe(ActivityAction.MemberRemoved);
  });

  it('lets an owner leave only when another owner stays', async () => {
    await expect(
      createService(member(WorkspaceRole.OWNER), 1).service.leave('ws-1', 'user-2', ACTOR),
    ).rejects.toBeInstanceOf(ConflictException);
    const { service, activity } = createService(member(WorkspaceRole.OWNER), 2);
    await service.leave('ws-1', 'user-2', ACTOR);
    expect(activity.entries[0]?.action).toBe(ActivityAction.MemberLeft);
  });

  it('keeps the user in at least one workspace', async () => {
    const { service, members } = createService(member(WorkspaceRole.EDITOR));
    members.countMemberships.mockResolvedValueOnce(1);
    await expect(service.leave('ws-1', 'user-2', ACTOR)).rejects.toBeInstanceOf(ConflictException);
    expect(members.remove).not.toHaveBeenCalled();
  });

  it('says when the member is not there', async () => {
    await expect(
      createService(null).service.remove('ws-1', ADMIN, 'user-9', ACTOR),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
