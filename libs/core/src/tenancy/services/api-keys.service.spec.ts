import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { hashSecret } from '@crossmart/common';
import { type ApiKey, WorkspaceRole } from '@crossmart/database';
import type { ApiKeyRepository } from '../repositories/api-key.repository.js';
import { API_KEY_TOKEN_PREFIX } from '../tenancy.constants.js';
import { ApiKeysService } from './api-keys.service.js';

const NOW = new Date('2026-11-01T12:00:00Z');
const ADMIN = { userId: 'user-1', role: WorkspaceRole.ADMIN };

function storedKey(overrides: Partial<ApiKey> = {}): ApiKey {
  return {
    id: 'key-1',
    workspaceId: 'ws-1',
    createdById: 'user-1',
    name: 'MCP',
    role: WorkspaceRole.EDITOR,
    prefix: 'cm_abcdefg',
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
    revoke: vi.fn(),
    markUsed: vi.fn(),
  };
  const service = new ApiKeysService(repository as unknown as ApiKeyRepository);
  return { service, repository };
}

describe('ApiKeysService.issue', () => {
  it('returns the secret once and stores only its hash', async () => {
    const { service, repository } = createService();

    const { secret, apiKey } = await service.issue('ws-1', ADMIN, {
      name: 'MCP',
      role: WorkspaceRole.EDITOR,
    });

    expect(secret.startsWith(API_KEY_TOKEN_PREFIX)).toBe(true);
    const [record] = repository.create.mock.calls[0];
    expect(record.hash).toBe(hashSecret(secret));
    expect(JSON.stringify(record)).not.toContain(secret);
    expect(secret.startsWith(apiKey.prefix)).toBe(true);
  });

  it('never issues an owner key', async () => {
    const { service } = createService();
    const owner = { userId: 'user-1', role: WorkspaceRole.OWNER };

    await expect(
      service.issue('ws-1', owner, { name: 'root', role: WorkspaceRole.OWNER }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('never issues a key with more access than its creator', async () => {
    const { service } = createService();
    const editor = { userId: 'user-2', role: WorkspaceRole.EDITOR };

    await expect(
      service.issue('ws-1', editor, { name: 'approve', role: WorkspaceRole.APPROVER }),
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
    repository.revoke.mockResolvedValue(false);

    await expect(service.revoke('ws-1', 'key-404')).rejects.toThrow(NotFoundException);
  });
});
