import { NotFoundException } from '@nestjs/common';
import type { AppConfigService } from '@crossmart/common';
import {
  AskCallerKeys,
  AskCallerType,
  type WorkspaceAccessService,
  WorkspacePermission,
} from '@crossmart/core';
import { WorkspaceRole } from '@crossmart/database';
import type { AuthenticatedRequest, Principal } from '../../auth/entities/principal.js';
import { PrincipalKind } from '../../auth/enums/principal-kind.enum.js';
import { AskCallerResolver } from './ask-caller.resolver.js';

const PERMISSIONS = new Set([WorkspacePermission.ViewProducts]);
const API_KEY: Principal = {
  kind: PrincipalKind.ApiKey,
  apiKeyId: 'key-1',
  workspaceId: 'ws-key',
  createdById: 'user-1',
  role: WorkspaceRole.VIEWER,
  customRole: null,
  permissions: PERMISSIONS,
};

function requestFrom(principal?: Principal): AuthenticatedRequest {
  const headers: Record<string, string> = { 'x-real-ip': '203.0.113.9', 'user-agent': 'agent/1' };
  return {
    principal,
    header: (name: string) => headers[name],
    ip: '127.0.0.1',
  } as unknown as AuthenticatedRequest;
}

function setup(
  role: { permissions: Set<WorkspacePermission> } | null = { permissions: PERMISSIONS },
) {
  const access = { findRole: vi.fn().mockResolvedValue(role) };
  const keys = new AskCallerKeys({ authSecret: 'x'.repeat(40) } as AppConfigService);
  return {
    resolver: new AskCallerResolver(keys, access as unknown as WorkspaceAccessService),
    access,
  };
}

describe('AskCallerResolver', () => {
  it('knows an anonymous caller by a hash of address and user agent only', async () => {
    const caller = await setup().resolver.resolve(requestFrom());

    expect(caller).toMatchObject({ type: AskCallerType.Anonymous, workspace: null, userId: null });
    expect(JSON.stringify(caller)).not.toContain('203.0.113.9');
  });

  it('refuses a workspace for an anonymous caller', async () => {
    await expect(setup().resolver.resolve(requestFrom(), 'ws-any')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('asks from an API key’s own workspace, and refuses any other', async () => {
    const { resolver } = setup();

    const caller = await resolver.resolve(requestFrom(API_KEY));

    expect(caller).toMatchObject({
      type: AskCallerType.ApiKey,
      workspace: { workspaceId: 'ws-key' },
    });
    await expect(resolver.resolve(requestFrom(API_KEY), 'ws-other')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('lets a person ask about a workspace they belong to only', async () => {
    const user: Principal = {
      kind: PrincipalKind.User,
      userId: 'user-1',
      name: 'Dana',
      email: 'dana@example.com',
      emailVerified: true,
    };
    const member = setup();
    const caller = await member.resolver.resolve(requestFrom(user), 'ws-mine');

    expect(member.access.findRole).toHaveBeenCalledWith('ws-mine', 'user-1');
    expect(caller.workspace?.workspaceId).toBe('ws-mine');
    await expect(setup(null).resolver.resolve(requestFrom(user), 'ws-theirs')).rejects.toThrow(
      NotFoundException,
    );
  });
});
