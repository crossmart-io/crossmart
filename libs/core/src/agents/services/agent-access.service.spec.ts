import { WorkspaceRole } from '@crossmart/database';
import { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import { resolveRole } from '../../tenancy/permissions/role-permissions.js';
import type { WorkspaceAccessService } from '../../tenancy/services/workspace-access.service.js';
import type { AgentGrant } from '../entities/agent-identity.js';
import { AgentScope } from '../enums/agent-scope.enum.js';
import type {
  AgentConnectionRepository,
  AgentConsentRecord,
} from '../repositories/agent-connection.repository.js';
import { AgentAccessService } from './agent-access.service.js';

const GRANT: AgentGrant = {
  userId: 'user-1',
  clientId: 'https://claude.ai/oauth/client.json',
  workspaceId: 'ws-1',
  scopes: [AgentScope.CatalogRead, AgentScope.CatalogWrite],
};

function consent(disabled = false): AgentConsentRecord {
  return { client: { name: 'Claude', uri: null, icon: null, disabled } } as AgentConsentRecord;
}

interface Setup {
  record?: AgentConsentRecord;
  role?: WorkspaceRole;
}

function setup({ record, role }: Setup) {
  const connections = { findConsent: vi.fn().mockResolvedValue(record ?? null) };
  const workspaceAccess = {
    findRole: vi.fn().mockResolvedValue(role ? resolveRole(role, null) : null),
  };
  return new AgentAccessService(
    connections as unknown as AgentConnectionRepository,
    workspaceAccess as unknown as WorkspaceAccessService,
  );
}

describe('AgentAccessService.authorize', () => {
  it('lets a connected agent act with its scopes, within the user’s role', async () => {
    const identity = await setup({ record: consent(), role: WorkspaceRole.VIEWER }).authorize(
      GRANT,
    );

    expect(identity).toMatchObject({ clientName: 'Claude', role: WorkspaceRole.VIEWER });
    expect(identity?.permissions.has(WorkspacePermission.ViewProducts)).toBe(true);
    expect(identity?.permissions.has(WorkspacePermission.EditProducts)).toBe(false);
  });

  it('refuses once the connection is revoked, the client disabled or the user gone', async () => {
    await expect(setup({ role: WorkspaceRole.OWNER }).authorize(GRANT)).resolves.toBeNull();
    await expect(
      setup({ record: consent(true), role: WorkspaceRole.OWNER }).authorize(GRANT),
    ).resolves.toBeNull();
    await expect(setup({ record: consent() }).authorize(GRANT)).resolves.toBeNull();
  });
});
