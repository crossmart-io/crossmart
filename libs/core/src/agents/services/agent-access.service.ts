import { Injectable } from '@nestjs/common';
import { WorkspaceAccessService } from '../../tenancy/services/workspace-access.service.js';
import type { AgentGrant, AgentIdentity } from '../entities/agent-identity.js';
import { agentPermissions } from '../permissions/agent-scope-permissions.js';
import { AgentConnectionRepository } from '../repositories/agent-connection.repository.js';
import { agentClientName } from '../rules/agent-client-name.js';

/**
 * Decides, on every request, whether a verified agent token may still act: its connection must
 * still exist, its client must not be disabled, and its user must still belong to the workspace.
 * What it may do is the intersection of its scopes and the user's role at this moment.
 */
@Injectable()
export class AgentAccessService {
  constructor(
    private readonly connections: AgentConnectionRepository,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  /** The agent's identity, or null when the token must be refused. */
  async authorize(grant: AgentGrant): Promise<AgentIdentity | null> {
    const [consent, role] = await Promise.all([
      this.connections.findConsent(grant),
      this.workspaceAccess.findRole(grant.workspaceId, grant.userId),
    ]);
    if (!consent || consent.client.disabled || !role) return null;
    return {
      ...grant,
      clientName: agentClientName(grant.clientId, consent.client.name),
      role: role.role,
      customRole: role.customRole,
      permissions: agentPermissions(grant.scopes, role.permissions),
    };
  }
}
