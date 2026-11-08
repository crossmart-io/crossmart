import { Injectable } from '@nestjs/common';
import {
  AGENT_WORKER_SCOPES,
  AgentWorkerTokenService,
  agentPermissions,
  WorkspaceAccessService,
  WorkspacePermission,
} from '@crossmart/core';
import { PrincipalKind } from '../enums/principal-kind.enum.js';
import type { AgentWorkerPrincipal } from '../entities/principal.js';

/**
 * Turns Agent Worker's credential into a principal: the token must verify, and the person must
 * still belong to the workspace and still hold `agent_worker:use`. What it may do is Agent
 * Worker's scopes narrowed by the person's role at this moment, so a change the person lost the
 * right to make since they approved it is refused.
 */
@Injectable()
export class AgentWorkerAuthenticator {
  constructor(
    private readonly tokens: AgentWorkerTokenService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  async authenticate(token: string): Promise<AgentWorkerPrincipal | null> {
    const scope = await this.tokens.verify(token);
    if (!scope) return null;
    const role = await this.workspaceAccess.findRole(scope.workspaceId, scope.userId);
    if (!role?.permissions.has(WorkspacePermission.UseAgentWorker)) return null;
    return {
      kind: PrincipalKind.AgentWorker,
      ...scope,
      role: role.role,
      customRole: role.customRole,
      permissions: agentPermissions(AGENT_WORKER_SCOPES, role.permissions),
    };
  }
}
