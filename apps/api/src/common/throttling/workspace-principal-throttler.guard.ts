import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import type { AuthenticatedRequest } from '../../auth/entities/principal.js';
import { PrincipalKind } from '../../auth/enums/principal-kind.enum.js';
import { principalTracker } from './principal-tracker.js';
import { NO_WORKSPACE, TRACKER_SEPARATOR } from './throttling.constants.js';

/** The tracker of a request without a principal, which these limits never guard in practice. */
const ANONYMOUS_TRACKER = [PrincipalKind.User, PrincipalKind.User].join(TRACKER_SEPARATOR);

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
    const caller = request.principal ? principalTracker(request.principal) : ANONYMOUS_TRACKER;
    return Promise.resolve([workspaceId, caller].join(TRACKER_SEPARATOR));
  }
}
