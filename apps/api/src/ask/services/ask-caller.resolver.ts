import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AGENT_WORKER_NAME,
  type AskCaller,
  AskCallerKeys,
  type AskCallerIdentity,
  AskCallerType,
  type AskWorkspaceAccess,
  WorkspaceAccessService,
} from '@crossmart/core';
import type { AuthenticatedRequest, Principal } from '../../auth/entities/principal.js';
import { PrincipalKind } from '../../auth/enums/principal-kind.enum.js';
import { clientIp } from '../../common/throttling/client-ip.js';
import { principalTracker } from '../../common/throttling/principal-tracker.js';
import { UNKNOWN_USER_AGENT, USER_AGENT_HEADER } from '../ask.constants.js';

/** Who the caller is, without the address and user agent the request adds. */
type CallerIdentity = Omit<AskCallerIdentity, 'ip' | 'userAgent'>;

const WORKSPACE_NOT_FOUND = 'Workspace not found';

const ANONYMOUS: CallerIdentity = {
  type: AskCallerType.Anonymous,
  principalKey: null,
  clientName: null,
  userId: null,
  workspace: null,
};

function accessOf(
  workspaceId: string,
  permissions: AskWorkspaceAccess['permissions'],
): AskWorkspaceAccess {
  return { workspaceId, permissions };
}

/**
 * Turns a request into the caller Ask stores and binds conversations to (ADR 0025): anonymous
 * callers by a salted hash of their address and user agent, identified ones by who they are.
 * API keys and agents ask from their own workspace; a signed-in person names one they belong to
 * (the app widget), and only then can ask about it. Nobody can name a workspace that is not theirs.
 */
@Injectable()
export class AskCallerResolver {
  constructor(
    private readonly keys: AskCallerKeys,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  async resolve(request: AuthenticatedRequest, workspaceId?: string): Promise<AskCaller> {
    const identity = await this.identityOf(request.principal, workspaceId);
    return this.keys.callerFrom({
      ...identity,
      ip: clientIp(request),
      userAgent: request.header(USER_AGENT_HEADER) ?? UNKNOWN_USER_AGENT,
    });
  }

  private async identityOf(
    principal: Principal | undefined,
    workspaceId: string | undefined,
  ): Promise<CallerIdentity> {
    if (!principal) {
      if (workspaceId) throw new NotFoundException(WORKSPACE_NOT_FOUND);
      return ANONYMOUS;
    }
    const principalKey = principalTracker(principal);
    switch (principal.kind) {
      case PrincipalKind.User:
        return {
          type: AskCallerType.User,
          principalKey,
          clientName: null,
          userId: principal.userId,
          workspace: workspaceId ? await this.memberAccess(workspaceId, principal.userId) : null,
        };
      case PrincipalKind.ApiKey:
        this.assertOwnWorkspace(principal.workspaceId, workspaceId);
        return {
          type: AskCallerType.ApiKey,
          principalKey,
          clientName: null,
          userId: principal.createdById,
          workspace: accessOf(principal.workspaceId, principal.permissions),
        };
      case PrincipalKind.Agent:
      case PrincipalKind.AgentWorker:
        this.assertOwnWorkspace(principal.workspaceId, workspaceId);
        return {
          type: AskCallerType.Agent,
          principalKey,
          clientName:
            principal.kind === PrincipalKind.Agent ? principal.clientName : AGENT_WORKER_NAME,
          userId: principal.userId,
          workspace: accessOf(principal.workspaceId, principal.permissions),
        };
    }
  }

  private async memberAccess(workspaceId: string, userId: string): Promise<AskWorkspaceAccess> {
    const role = await this.workspaceAccess.findRole(workspaceId, userId);
    if (!role) throw new NotFoundException(WORKSPACE_NOT_FOUND);
    return accessOf(workspaceId, role.permissions);
  }

  /** Keys and agents belong to one workspace; naming another is refused like an unknown one. */
  private assertOwnWorkspace(own: string, named: string | undefined): void {
    if (named && named !== own) throw new NotFoundException(WORKSPACE_NOT_FOUND);
  }
}
