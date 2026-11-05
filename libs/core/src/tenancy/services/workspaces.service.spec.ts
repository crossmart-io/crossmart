import { ForbiddenException, HttpStatus } from '@nestjs/common';
import { WorkspaceRole } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import { Feature } from '../../entitlements/enums/feature.enum.js';
import type { EntitlementService } from '../../entitlements/services/entitlement.service.js';
import { planLimitReached } from '../../entitlements/testing/entitlement.fixtures.js';
import { resolveRole } from '../permissions/role-permissions.js';
import type { NewWorkspace, WorkspaceRepository } from '../repositories/workspace.repository.js';
import { WorkspacesService } from './workspaces.service.js';

function stored(fields: Partial<NewWorkspace> & { id?: string } = {}) {
  return {
    id: fields.id ?? 'ws-2',
    organizationId: 'org-1',
    name: fields.name ?? 'EU store',
    slug: fields.slug ?? 'eu-store',
    currency: fields.currency ?? 'EUR',
    timeZone: fields.timeZone ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
    organization: { name: 'Ana Cohen' },
  };
}

function createService() {
  const workspaces = {
    isOrganizationOwner: vi.fn().mockResolvedValue(true),
    slugsLike: vi.fn().mockResolvedValue(['eu-store']),
    create: vi.fn((record: NewWorkspace) => Promise.resolve(stored(record))),
    findById: vi.fn().mockResolvedValue(stored({ name: 'Default' })),
    update: vi.fn((_id: string, changes: { name?: string; timeZone?: string }) =>
      Promise.resolve(stored({ name: changes.name ?? 'Default', timeZone: changes.timeZone })),
    ),
  };
  const activity = new InMemoryActivityRecorder();
  const entitlements = { assert: vi.fn().mockResolvedValue(undefined) };
  const service = new WorkspacesService(
    workspaces as unknown as WorkspaceRepository,
    activity,
    entitlements as unknown as EntitlementService,
  );
  return { service, workspaces, activity, entitlements };
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
      timeZone: null,
      ownerId: 'user-1',
    });
    expect(created).toMatchObject({ role: WorkspaceRole.OWNER, displayName: 'EU store' });
    expect(activity.entries[0]?.action).toBe(ActivityAction.WorkspaceCreated);
  });

  it('refuses non-owners', async () => {
    const { service, workspaces } = createService();
    workspaces.isOrganizationOwner.mockResolvedValueOnce(false);
    await expect(service.create('org-1', 'user-9', { name: 'X' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('asks the plan for room, and creates nothing when it has none', async () => {
    const { service, workspaces, entitlements } = createService();
    entitlements.assert.mockRejectedValueOnce(planLimitReached(Feature.Workspaces));
    await expect(service.create('org-1', 'user-1', { name: 'X' })).rejects.toMatchObject({
      status: HttpStatus.PAYMENT_REQUIRED,
    });
    expect(entitlements.assert).toHaveBeenCalledWith('org-1', Feature.Workspaces);
    expect(workspaces.create).not.toHaveBeenCalled();
  });
});

describe('WorkspacesService.update', () => {
  it('records the old name', async () => {
    const { service, activity } = createService();
    const access = resolveRole(WorkspaceRole.ADMIN, null);
    const renamed = await service.update(
      'ws-2',
      { name: 'Main store' },
      access,
      Actor.user('user-1'),
    );
    expect(renamed.displayName).toBe('Main store');
    expect(activity.entries[0]).toMatchObject({
      action: ActivityAction.WorkspaceRenamed,
      detail: 'Default',
      subject: { label: 'Main store' },
    });
  });

  it('records a new time zone', async () => {
    const { service, activity } = createService();
    const access = resolveRole(WorkspaceRole.ADMIN, null);
    const updated = await service.update(
      'ws-2',
      { timeZone: 'Asia/Jerusalem' },
      access,
      Actor.user('user-1'),
    );
    expect(updated.timeZone).toBe('Asia/Jerusalem');
    expect(activity.entries[0]).toMatchObject({
      action: ActivityAction.WorkspaceTimeZoneChanged,
      detail: 'Asia/Jerusalem',
    });
  });
});
