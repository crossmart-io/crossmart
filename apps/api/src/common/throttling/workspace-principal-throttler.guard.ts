import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import type { AuthenticatedRequest, Principal } from '../../auth/entities/principal.js';
import { PrincipalKind } from '../../auth/enums/principal-kind.enum.js';
import { NO_WORKSPACE, TRACKER_SEPARATOR } from './throttling.constants.js';

function principalId(principal: Principal | undefined): string {
  switch (principal?.kind) {
    case undefined:
      return PrincipalKind.User;
    case PrincipalKind.User:
      return principal.userId;
    case PrincipalKind.ApiKey:
      return principal.apiKeyId;
    case PrincipalKind.Agent:
      // One budget per agent and the user it acts for, so one agent cannot exhaust another's.
      return [principal.clientId, principal.userId].join(TRACKER_SEPARATOR);
  }
}

/**
 * Rate limits per workspace and caller (a person, an API key or an agent), not per IP: callers behind one
 * address do not share a budget, and one caller cannot spend a workspace's budget for others.
 * It runs after authentication, so the principal is known. Opt-in with `@UseGuards` on the
 * routes to limit; nothing else is throttled by it.
 */
@Injectable()
export class WorkspacePrincipalThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(request: AuthenticatedRequest): Promise<string> {
    const workspaceId = request.params[WORKSPACE_ID_PARAM] ?? NO_WORKSPACE;
    const kind = request.principal?.kind ?? PrincipalKind.User;
    return Promise.resolve(
      [workspaceId, kind, principalId(request.principal)].join(TRACKER_SEPARATOR),
    );
  }
}
