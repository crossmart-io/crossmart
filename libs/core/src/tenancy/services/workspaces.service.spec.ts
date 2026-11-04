import { ConflictException, ForbiddenException } from '@nestjs/common';
import { WorkspaceRole } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import { resolveRole } from '../permissions/role-permissions.js';
import type { NewWorkspace, WorkspaceRepository } from '../repositories/workspace.repository.js';
import { MAX_WORKSPACES_PER_ORGANIZATION } from '../tenancy.constants.js';
import { WorkspacesService } from './workspaces.service.js';

function stored(fields: Partial<NewWorkspace> & { id?: string } = {}) {
  return {
    id: fields.id ?? 'ws-2',
    organizationId: 'org-1',
    name: fields.name ?? 'EU store',
    slug: fields.slug ?? 'eu-store',
    currency: fields.currency ?? 'EUR',
    createdAt: new Date(),
    updatedAt: new Date(),
    organization: { name: 'Ana Cohen' },
  };
}

function createService() {
  const workspaces = {
    isOrganizationOwner: vi.fn().mockResolvedValue(true),
    countInOrganization: vi.fn().mockResolvedValue(1),
    slugsLike: vi.fn().mockResolvedValue(['eu-store']),
    create: vi.fn((record: NewWorkspace) => Promise.resolve(stored(record))),
    findById: vi.fn().mockResolvedValue(stored({ name: 'Default' })),
    rename: vi.fn((_id: string, name: string) => Promise.resolve(stored({ name }))),
  };
  const activity = new InMemoryActivityRecorder();
  const service = new WorkspacesService(workspaces as unknown as WorkspaceRepository, activity);
  return { service, workspaces, activity };
}

describe('WorkspacesService.create', () => {
  it('gives the workspace a free slug and its creator ownership', async () => {
    const { service, workspaces, activity } = createService();
    const created = await service.create('org-1', 'user-1', {
      name: ' EU store ',
      currency: 'eur',
    });
    expect(workspaces.create).toHaveBeenCalledWith({
      organizationId: 'org-1',
      name: 'EU store',
      slug: 'eu-store-2',
      currency: 'EUR',
      ownerId: 'user-1',
    });
    expect(created).toMatchObject({ role: WorkspaceRole.OWNER, displayName: 'EU store' });
    expect(activity.entries[0]?.action).toBe(ActivityAction.WorkspaceCreated);
  });

  it('refuses non-owners and organizations at the limit', async () => {
    const { service, workspaces } = createService();
    workspaces.isOrganizationOwner.mockResolvedValueOnce(false);
    await expect(service.create('org-1', 'user-9', { name: 'X' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    workspaces.countInOrganization.mockResolvedValueOnce(MAX_WORKSPACES_PER_ORGANIZATION);
    await expect(service.create('org-1', 'user-1', { name: 'X' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

describe('WorkspacesService.rename', () => {
  it('records the old name', async () => {
    const { service, activity } = createService();
    const access = resolveRole(WorkspaceRole.ADMIN, null);
    const renamed = await service.rename('ws-2', 'Main store', access, Actor.user('user-1'));
    expect(renamed.displayName).toBe('Main store');
    expect(activity.entries[0]).toMatchObject({
      action: ActivityAction.WorkspaceRenamed,
      detail: 'Default',
      subject: { label: 'Main store' },
    });
  });
});
