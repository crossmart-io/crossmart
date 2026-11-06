import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  type ResolvedRole,
  WorkspaceAccessService,
  type WorkspacePermission,
} from '@crossmart/core';
import {
  ALLOWS_ANONYMOUS_METADATA_KEY,
  REQUIRED_PERMISSION_METADATA_KEY,
  WORKSPACE_ID_PARAM,
} from '../auth.constants.js';
import { PrincipalKind } from '../enums/principal-kind.enum.js';
import type { AuthenticatedRequest, Principal } from '../entities/principal.js';

/**
 * Global guard for routes marked `@RequirePermission()`: resolves the caller's role in the
 * `:workspaceId` workspace and checks it. Outsiders get 404 so workspace ids do not leak.
 * Agents may call workspace routes, and routes open to anyone (`@AllowAnonymous()`, such as Ask
 * Crossmart); every other route refuses them.
 */
@Injectable()
export class WorkspaceAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<WorkspacePermission | undefined>(
      REQUIRED_PERMISSION_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!permission) {
      if (request.principal?.kind === PrincipalKind.Agent && !this.isOpenToAnyone(context)) {
        throw new ForbiddenException('Agents can only use workspace routes');
      }
      return true;
    }
    const workspaceId = request.params[WORKSPACE_ID_PARAM];
    const access =
      request.principal && typeof workspaceId === 'string'
        ? await this.findAccess(request.principal, workspaceId)
        : null;
    if (!access) {
      throw new NotFoundException('Workspace not found');
    }
    if (!access.permissions.has(permission)) {
      throw new ForbiddenException(`Requires the ${permission} permission`);
    }
    request.workspaceAccess = access;
    return true;
  }

  private isOpenToAnyone(context: ExecutionContext): boolean {
    return Boolean(
      this.reflector.getAllAndOverride<boolean>(ALLOWS_ANONYMOUS_METADATA_KEY, [
        context.getHandler(),
        context.getClass(),
      ]),
    );
  }

  /** API keys and agents carry their resolved role; a user's comes from their membership. */
  private async findAccess(
    principal: Principal,
    workspaceId: string,
  ): Promise<ResolvedRole | null> {
    if (principal.kind === PrincipalKind.ApiKey || principal.kind === PrincipalKind.Agent) {
      const { role, customRole, permissions } = principal;
      return principal.workspaceId === workspaceId ? { role, customRole, permissions } : null;
    }
    return this.workspaceAccess.findRole(workspaceId, principal.userId);
  }
}
