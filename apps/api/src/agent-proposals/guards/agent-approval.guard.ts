import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  type AgentApprovalExemption,
  OutsideAgentChanges,
  qualifiesFor,
  WorkspaceSettingsRepository,
} from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import type { AuthenticatedRequest } from '../../auth/entities/principal.js';
import { PrincipalKind } from '../../auth/enums/principal-kind.enum.js';
import { READ_ONLY_HTTP_METHODS } from '../../billing/billing.constants.js';
import {
  AGENT_APPROVAL_EXEMPT_METADATA_KEY,
  AGENT_APPROVAL_REQUIRED_CODE,
  AGENT_APPROVAL_REQUIRED_MESSAGE,
  AGENT_APPROVAL_EXEMPT_WHEN_METADATA_KEY,
} from '../agent-proposals.constants.js';

/**
 * Global guard (ADR 0028): while a workspace approves outside agents' changes, a connected agent
 * (OAuth) cannot write over REST directly; it is told to propose the change. API keys,
 * signed-in people, Crossmart Agent and approved proposals being applied pass, as do reads,
 * routes marked `@AgentApprovalExempt()`, and requests whose body qualifies for the route's
 * `@AgentApprovalExemptWhen()` (a new product created as a draft).
 */
@Injectable()
export class AgentApprovalGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly settings: WorkspaceSettingsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const workspaceId = request.params[WORKSPACE_ID_PARAM];
    if (!this.isDirectAgentWrite(request) || typeof workspaceId !== 'string') return true;
    if (this.isExempt(context) || this.qualifiesForExemption(context, request)) return true;
    const policy = await this.settings.outsideAgentChanges(workspaceId);
    if (policy === OutsideAgentChanges.ApplyDirectly) return true;
    throw new ForbiddenException({
      statusCode: HttpStatus.FORBIDDEN,
      code: AGENT_APPROVAL_REQUIRED_CODE,
      message: AGENT_APPROVAL_REQUIRED_MESSAGE,
    });
  }

  /** A connected agent's own write in a workspace it reached, not one a person approved. */
  private isDirectAgentWrite(request: AuthenticatedRequest): boolean {
    const principal = request.principal;
    return (
      principal?.kind === PrincipalKind.Agent &&
      !principal.approvedByUserId &&
      request.workspaceAccess !== undefined &&
      !READ_ONLY_HTTP_METHODS.has(request.method)
    );
  }

  /** The body, still as sent (guards run before validation), qualifies for the route's exemption. */
  private qualifiesForExemption(context: ExecutionContext, request: AuthenticatedRequest): boolean {
    const exemption = this.reflector.get<AgentApprovalExemption | undefined>(
      AGENT_APPROVAL_EXEMPT_WHEN_METADATA_KEY,
      context.getHandler(),
    );
    return exemption !== undefined && qualifiesFor(exemption, request.body);
  }

  private isExempt(context: ExecutionContext): boolean {
    return Boolean(
      this.reflector.getAllAndOverride<boolean>(AGENT_APPROVAL_EXEMPT_METADATA_KEY, [
        context.getHandler(),
        context.getClass(),
      ]),
    );
  }
}
