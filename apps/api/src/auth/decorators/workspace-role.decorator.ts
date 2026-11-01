import { createParamDecorator, type ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { WorkspaceRole } from '@crossmart/database';
import type { AuthenticatedRequest } from '../entities/principal.js';

/** The caller's role in the current workspace, resolved by the workspace guard. */
export const CurrentWorkspaceRole = createParamDecorator(
  (_data: unknown, context: ExecutionContext): WorkspaceRole => {
    const { workspaceRole } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!workspaceRole) {
      throw new ForbiddenException();
    }
    return workspaceRole;
  },
);
