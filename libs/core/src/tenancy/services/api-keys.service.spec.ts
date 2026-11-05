import { ForbiddenException, HttpStatus, NotFoundException } from '@nestjs/common';
import { hashSecret } from '@crossmart/common';
import { WorkspaceRole } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import { Feature } from '../../entitlements/enums/feature.enum.js';
import type { EntitlementService } from '../../entitlements/services/entitlement.service.js';
import { planLimitReached } from '../../entitlements/testing/entitlement.fixtures.js';
import type { ApiKeyRepository, ApiKeyWithRole } from '../repositories/api-key.repository.js';
import { builtInPermissions } from '../permissions/role-permissions.js';
import { fakeRoleResolver, managerWith } from '../testing/role-fixtures.js';
import { API_KEY_TOKEN_PREFIX } from '../tenancy.constants.js';
import { ApiKeysService } from './api-keys.service.js';

const NOW = new Date('2026-11-01T12:00:00Z');
const ADMIN = managerWith(WorkspaceRole.ADMIN);
const ACTOR = Actor.user('user-1');

function storedKey(overrides: Partial<ApiKeyWithRole> = {}): ApiKeyWithRole {
  return {
    id: 'key-1',
    workspaceId: 'ws-1',
    createdById: 'user-1',
    name: 'MCP',
    role: WorkspaceRole.EDITOR,
    prefix: 'cm_abcdefg',
    customRoleId: null,
    customRole: null,
    hash: 'hash',
    lastUsedAt: null,
    expiresAt: null,
    revokedAt: null,
    createdAt: NOW,
    ...overrides,
  };
}

function createService() {
  const repository = {
    create: vi.fn((record) => Promise.resolve(storedKey(record))),
    findByHash: vi.fn(),
    listActive: vi.fn(),
    findActive: vi.fn().mockResolvedValue(storedKey()),
    revoke: vi.fn(),
    markUsed: vi.fn(),
  };
  const activity = new InMemoryActivityRecorder();
  const entitlements = { assertInWorkspace: vi.fn().mockResolvedValue(undefined) };
  const service = new ApiKeysService(
    repository as unknown as ApiKeyRepository,
    fakeRoleResolver(),
    activity,
    entitlements as unknown as EntitlementService,
  );
  return { service, repository, activity, entitlements };
}

describe('ApiKeysService.issue', () => {
  it('returns the secret once and stores only its hash', async () => {
    const { service, repository, activity } = createService();

    const { secret, apiKey } = await service.issue(
      'ws-1',
      ADMIN,
      { name: 'MCP', role: WorkspaceRole.EDITOR },
      ACTOR,
    );

    expect(secret.startsWith(API_KEY_TOKEN_PREFIX)).toBe(true);
    const [record] = repository.create.mock.calls[0];
    expect(record.hash).toBe(hashSecret(secret));
    expect(JSON.stringify(record)).not.toContain(secret);
    expect(secret.startsWith(apiKey.prefix)).toBe(true);
    expect(activity.entries[0]).toMatchObject({
      action: ActivityAction.ApiKeyCreated,
      subject: { label: 'MCP' },
    });
    expect(JSON.stringify(activity.recorded)).not.toContain(secret);
  });

  it('never issues an owner key', async () => {
    const { service } = createService();
    const owner = managerWith(WorkspaceRole.OWNER);

    await expect(
      service.issue('ws-1', owner, { name: 'root', role: WorkspaceRole.OWNER }, ACTOR),
    ).rejects.toThrow(ForbiddenException);
  });

  it('never issues a key with more access than its creator', async () => {
    const { service } = createService();
    const editor = managerWith(WorkspaceRole.EDITOR, 'user-2');

    await expect(
      service.issue('ws-1', editor, { name: 'approve', role: WorkspaceRole.APPROVER }, ACTOR),
    ).rejects.toThrow(ForbiddenException);
  });
});

describe('ApiKeysService.authenticate', () => {
  it('resolves a valid key to its workspace and role', async () => {
    const { service, repository } = createService();
    repository.findByHash.mockResolvedValue(storedKey());

    const identity = await service.authenticate(`${API_KEY_TOKEN_PREFIX}secret`, NOW);

    expect(identity).toEqual({
      apiKeyId: 'key-1',
      workspaceId: 'ws-1',
      role: WorkspaceRole.EDITOR,
      customRole: null,
      permissions: builtInPermissions(WorkspaceRole.EDITOR),
      createdById: 'user-1',
    });
    expect(repository.markUsed).toHaveBeenCalledWith('key-1', NOW);
  });

  it('skips the lookup for tokens without the key prefix', async () => {
    const { service, repository } = createService();

    expect(await service.authenticate('session-token', NOW)).toBeNull();
    expect(repository.findByHash).not.toHaveBeenCalled();
  });

  it.each([
    ['revoked', { revokedAt: new Date('2026-10-01') }],
    ['expired', { expiresAt: new Date('2026-10-31') }],
  ])('rejects a %s key', async (_state, overrides) => {
    const { service, repository } = createService();
    repository.findByHash.mockResolvedValue(storedKey(overrides));

    expect(await service.authenticate(`${API_KEY_TOKEN_PREFIX}secret`, NOW)).toBeNull();
  });

  it('records use at most once a minute', async () => {
    const { service, repository } = createService();
    repository.findByHash.mockResolvedValue(
      storedKey({ lastUsedAt: new Date(NOW.getTime() - 5_000) }),
    );

    await service.authenticate(`${API_KEY_TOKEN_PREFIX}secret`, NOW);

    expect(repository.markUsed).not.toHaveBeenCalled();
  });
});

describe('ApiKeysService.revoke', () => {
  it('reports a key that is not in the workspace as not found', async () => {
    const { service, repository } = createService();
    repository.findActive.mockResolvedValue(null);

    await expect(service.revoke('ws-1', 'key-404', ADMIN, ACTOR)).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.revoke).not.toHaveBeenCalled();
  });

  it('records the revoked key by name', async () => {
    const { service, repository, activity } = createService();
    repository.revoke.mockResolvedValue({ id: 'key-1', name: 'MCP' });

    await service.revoke('ws-1', 'key-1', ADMIN, ACTOR);

    expect(repository.findActive).toHaveBeenCalledWith('ws-1', 'key-1');
    expect(activity.entries[0]).toMatchObject({
      action: ActivityAction.ApiKeyRevoked,
      subject: { id: 'key-1', label: 'MCP' },
    });
  });

  it('refuses to revoke another member’s key with more access than the revoker', async () => {
    const { service, repository } = createService();
    repository.findActive.mockResolvedValue(
      storedKey({ role: WorkspaceRole.ADMIN, createdById: 'owner-1' }),
    );
    const editor = managerWith(WorkspaceRole.EDITOR, 'user-2');

    await expect(service.revoke('ws-1', 'key-1', editor, ACTOR)).rejects.toThrow(
      ForbiddenException,
    );
    expect(repository.revoke).not.toHaveBeenCalled();
  });

  it('lets a member revoke keys they created, even after losing access', async () => {
    const { service, repository } = createService();
    repository.findActive.mockResolvedValue(
      storedKey({ role: WorkspaceRole.ADMIN, createdById: 'user-2' }),
    );
    repository.revoke.mockResolvedValue({ id: 'key-1', name: 'MCP' });

    await service.revoke('ws-1', 'key-1', managerWith(WorkspaceRole.EDITOR, 'user-2'), ACTOR);

    expect(repository.revoke).toHaveBeenCalled();
  });
});

describe('ApiKeysService.issue and the plan', () => {
  it('asks the plan for room, and creates no key without it', async () => {
    const { service, repository, entitlements } = createService();
    entitlements.assertInWorkspace.mockRejectedValueOnce(planLimitReached(Feature.ApiKeys));
    await expect(
      service.issue('ws-1', ADMIN, { name: 'MCP', role: WorkspaceRole.EDITOR }, ACTOR),
    ).rejects.toMatchObject({ status: HttpStatus.PAYMENT_REQUIRED });
    expect(entitlements.assertInWorkspace).toHaveBeenCalledWith('ws-1', Feature.ApiKeys);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
