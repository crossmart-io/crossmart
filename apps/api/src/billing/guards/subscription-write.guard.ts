import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionAccessPolicy } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import type { AuthenticatedRequest } from '../../auth/entities/principal.js';
import {
  ALLOWED_WHILE_READ_ONLY_METADATA_KEY,
  READ_ONLY_HTTP_METHODS,
} from '../billing.constants.js';

/**
 * Global guard that makes an organization without a subscription in good standing read-only
 * (ADR 0024): writes to its workspaces answer 402 `subscription_inactive`, whoever calls (people,
 * API keys, agents). Runs after the workspace guard, so only members ever learn of it. Reads,
 * and routes marked `@AllowedWhileReadOnly()`, always pass; so does everything where billing or
 * `ENTITLEMENTS_ENFORCED` is off.
 */
@Injectable()
export class SubscriptionWriteGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptionAccess: SubscriptionAccessPolicy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const workspaceId = request.params[WORKSPACE_ID_PARAM];
    if (
      READ_ONLY_HTTP_METHODS.has(request.method) ||
      !this.subscriptionAccess.enforced ||
      !request.workspaceAccess ||
      typeof workspaceId !== 'string' ||
      this.isAllowedWhileReadOnly(context)
    ) {
      return true;
    }
    await this.subscriptionAccess.assertWritableInWorkspace(workspaceId);
    return true;
  }

  private isAllowedWhileReadOnly(context: ExecutionContext): boolean {
    return Boolean(
      this.reflector.getAllAndOverride<boolean>(ALLOWED_WHILE_READ_ONLY_METADATA_KEY, [
        context.getHandler(),
        context.getClass(),
      ]),
    );
  }
}
