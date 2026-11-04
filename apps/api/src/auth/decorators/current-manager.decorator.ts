import { createParamDecorator, type ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { Actor, MembershipManager } from '@crossmart/core';
import type { AuthenticatedRequest } from '../entities/principal.js';
import { actingUserId, toActor } from '../principal.utils.js';

/** Who manages the workspace in this request: their user and role, and who the log credits. */
export interface ActingManager {
  manager: MembershipManager;
  actor: Actor;
}

/** For routes behind `@RequirePermission()`, which resolves the caller's workspace role. */
export const CurrentManager = createParamDecorator(
  (_data: unknown, context: ExecutionContext): ActingManager => {
    const { principal, workspaceRole } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!principal || !workspaceRole) {
      throw new ForbiddenException();
    }
    return {
      manager: { userId: actingUserId(principal), role: workspaceRole },
      actor: toActor(principal),
    };
  },
);
