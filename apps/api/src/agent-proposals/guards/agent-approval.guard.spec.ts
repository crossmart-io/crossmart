import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OutsideAgentChanges, type WorkspaceSettingsRepository } from '@crossmart/core';
import type { AuthenticatedRequest, Principal } from '../../auth/entities/principal.js';
import { PrincipalKind } from '../../auth/enums/principal-kind.enum.js';
import { AgentApprovalGuard } from './agent-approval.guard.js';

const WORKSPACE_ID = 'ws-1';
const ACCESS = { role: 'EDITOR', customRole: null, permissions: new Set() };

const AGENT = { kind: PrincipalKind.Agent, userId: 'u-1', clientId: 'c-1' } as unknown as Principal;
const KEY = { kind: PrincipalKind.ApiKey, apiKeyId: 'k-1' } as unknown as Principal;

function context(principal: Principal, method: string): ExecutionContext {
  const request = {
    principal,
    method,
    params: { workspaceId: WORKSPACE_ID },
    workspaceAccess: ACCESS,
  } as unknown as AuthenticatedRequest;
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => undefined,
    getClass: () => class Controller {},
  } as unknown as ExecutionContext;
}

function guard(policy: OutsideAgentChanges, exempt = false) {
  const reflector = new Reflector();
  vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(exempt);
  const settings = { outsideAgentChanges: vi.fn(() => Promise.resolve(policy)) };
  const instance = new AgentApprovalGuard(
    reflector,
    settings as unknown as WorkspaceSettingsRepository,
  );
  return { instance, settings };
}

describe('AgentApprovalGuard', () => {
  it('turns a connected agent’s write away while changes need approval', async () => {
    const { instance } = guard(OutsideAgentChanges.RequireApproval);
    await expect(instance.canActivate(context(AGENT, 'PATCH'))).rejects.toThrow(ForbiddenException);
  });

  it('lets reads, keys, exempt routes and approved proposals through', async () => {
    const { instance, settings } = guard(OutsideAgentChanges.RequireApproval);
    const approved = { ...AGENT, approvedByUserId: 'u-2' } as Principal;

    await expect(instance.canActivate(context(AGENT, 'GET'))).resolves.toBe(true);
    await expect(instance.canActivate(context(KEY, 'POST'))).resolves.toBe(true);
    await expect(instance.canActivate(context(approved, 'POST'))).resolves.toBe(true);
    expect(settings.outsideAgentChanges).not.toHaveBeenCalled();

    const exempt = guard(OutsideAgentChanges.RequireApproval, true);
    await expect(exempt.instance.canActivate(context(AGENT, 'POST'))).resolves.toBe(true);
  });

  it('lets agents write when the workspace applies their changes directly', async () => {
    const { instance } = guard(OutsideAgentChanges.ApplyDirectly);
    await expect(instance.canActivate(context(AGENT, 'DELETE'))).resolves.toBe(true);
  });
});
