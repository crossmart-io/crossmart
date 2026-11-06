import type { Reflector } from '@nestjs/core';
import type { ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import type { AuthenticatedRequest } from '../../auth/entities/principal.js';
import { PrincipalKind } from '../../auth/enums/principal-kind.enum.js';
import { WorkspacePrincipalThrottlerGuard } from './workspace-principal-throttler.guard.js';

class ExposedGuard extends WorkspacePrincipalThrottlerGuard {
  tracker(request: Partial<AuthenticatedRequest>): Promise<string> {
    return this.getTracker(request as AuthenticatedRequest);
  }
}

const guard = new ExposedGuard(
  { throttlers: [] } as ThrottlerModuleOptions,
  {} as ThrottlerStorage,
  {} as Reflector,
);

describe('WorkspacePrincipalThrottlerGuard', () => {
  it('tracks each person and each API key per workspace', async () => {
    const params = { workspaceId: 'ws-1' };
    const user = {
      kind: PrincipalKind.User,
      userId: 'user-1',
      name: 'A',
      email: 'a@x.io',
    } as const;

    expect(await guard.tracker({ params, principal: user })).toBe('ws-1:user:user-1');
    expect(
      await guard.tracker({
        params,
        principal: {
          kind: PrincipalKind.ApiKey,
          apiKeyId: 'key-1',
        } as AuthenticatedRequest['principal'],
      }),
    ).toBe('ws-1:api-key:key-1');
  });
});
