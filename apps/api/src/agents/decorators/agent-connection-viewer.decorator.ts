import { createParamDecorator, type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { type AgentConnectionViewer, WorkspacePermission } from '@crossmart/core';
import type { AuthenticatedRequest } from '../../auth/entities/principal.js';
import { requireUser } from '../../auth/principal.utils.js';

/**
 * Who is looking at a workspace's agent connections: a signed-in user, who manages everyone's
 * when they may manage API keys, and only their own otherwise.
 */
export const CurrentAgentConnectionViewer = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AgentConnectionViewer => {
    const { principal, workspaceAccess } = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    if (!principal || !workspaceAccess) {
      throw new ForbiddenException();
    }
    return {
      userId: requireUser(principal).userId,
      managesAll: workspaceAccess.permissions.has(WorkspacePermission.ManageApiKeys),
    };
  },
);
