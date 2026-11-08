import { createParamDecorator, type ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { WorkspaceEventScope } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import type { AuthenticatedRequest, Principal } from '../../auth/entities/principal.js';
import { PrincipalKind } from '../../auth/enums/principal-kind.enum.js';

/** Crossmart Agent conversations are a person's own; keys and agents read none. */
function viewerOf(principal: Principal): string | null {
  return principal.kind === PrincipalKind.User ? principal.userId : null;
}

/**
 * Whose event stream it is, for routes behind `@RequirePermission()`: the workspace, the person
 * reading (if a person), and their permissions there, which decide the sources they see.
 */
export const CurrentEventScope = createParamDecorator(
  (_data: unknown, context: ExecutionContext): WorkspaceEventScope => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const workspaceId = request.params[WORKSPACE_ID_PARAM];
    const { principal, workspaceAccess } = request;
    if (!principal || !workspaceAccess || typeof workspaceId !== 'string') {
      throw new ForbiddenException();
    }
    return {
      workspaceId,
      viewerUserId: viewerOf(principal),
      permissions: workspaceAccess.permissions,
    };
  },
);
