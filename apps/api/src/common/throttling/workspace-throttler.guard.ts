import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import type { AuthenticatedRequest } from '../../auth/entities/principal.js';
import { NO_WORKSPACE } from './throttling.constants.js';

/**
 * Rate limits per workspace, whoever calls: for routes whose cost the workspace bears as a
 * whole, such as Agent Worker's turns. Opt-in with `@UseGuards` and `@Throttle()`.
 */
@Injectable()
export class WorkspaceThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(request: AuthenticatedRequest): Promise<string> {
    const workspaceId = request.params[WORKSPACE_ID_PARAM];
    return Promise.resolve(typeof workspaceId === 'string' ? workspaceId : NO_WORKSPACE);
  }
}
