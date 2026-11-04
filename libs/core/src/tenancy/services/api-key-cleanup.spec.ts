import { WorkspaceRole } from '@crossmart/database';
import { builtInPermissions } from '../permissions/role-permissions.js';
import type { ApiKeyRepository } from '../repositories/api-key.repository.js';
import { ApiKeyCleanup } from './api-key-cleanup.js';

const KEYS = [
  { id: 'admin-key', role: WorkspaceRole.ADMIN, customRole: null },
  { id: 'viewer-key', role: WorkspaceRole.VIEWER, customRole: null },
];

function createCleanup() {
  const apiKeys = {
    listActiveCreatedBy: vi.fn().mockResolvedValue(KEYS),
    revokeMany: vi.fn(),
  };
  return { cleanup: new ApiKeyCleanup(apiKeys as unknown as ApiKeyRepository), apiKeys };
}

describe('ApiKeyCleanup.revokeBeyond', () => {
  it('revokes only the keys that allow more than the creator now has', async () => {
    const { cleanup, apiKeys } = createCleanup();
    await cleanup.revokeBeyond('ws-1', 'user-1', builtInPermissions(WorkspaceRole.EDITOR));
    expect(apiKeys.revokeMany).toHaveBeenCalledWith(['admin-key'], expect.any(Date));
  });

  it('revokes every key when the creator has no access left', async () => {
    const { cleanup, apiKeys } = createCleanup();
    await cleanup.revokeBeyond('ws-1', 'user-1', null);
    expect(apiKeys.revokeMany).toHaveBeenCalledWith(['admin-key', 'viewer-key'], expect.any(Date));
  });
});
