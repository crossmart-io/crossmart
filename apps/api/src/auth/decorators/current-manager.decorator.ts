import { createParamDecorator, type ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { Actor, MembershipManager } from '@crossmart/core';
import type { AuthenticatedRequest } from '../entities/principal.js';
import { actingUserId, toActor } from '../principal.utils.js';

/** Who manages the workspace in this request: their user and permissions, and who the log credits. */
export interface ActingManager {
  manager: MembershipManager;
  actor: Actor;
}

/** For routes behind `@RequirePermission()`, which resolves the caller's workspace role. */
export const CurrentManager = createParamDecorator(
  (_data: unknown, context: ExecutionContext): ActingManager => {
    const { principal, workspaceAccess } = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    if (!principal || !workspaceAccess) {
      throw new ForbiddenException();
    }
    return {
      manager: { userId: actingUserId(principal), permissions: workspaceAccess.permissions },
      actor: toActor(principal),
    };
  },
);
