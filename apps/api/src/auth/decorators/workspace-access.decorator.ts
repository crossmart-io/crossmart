import { createParamDecorator, type ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { ResolvedRole } from '@crossmart/core';
import type { AuthenticatedRequest } from '../entities/principal.js';

/** The caller's role and permissions in the current workspace, resolved by the workspace guard. */
export const CurrentWorkspaceAccess = createParamDecorator(
  (_data: unknown, context: ExecutionContext): ResolvedRole => {
    const { workspaceAccess } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!workspaceAccess) {
      throw new ForbiddenException();
    }
    return workspaceAccess;
  },
);
