import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import type { AuthenticatedRequest } from '../../auth/entities/principal.js';
import { PrincipalKind } from '../../auth/enums/principal-kind.enum.js';
import {
  ASK_ANONYMOUS_PER_DAY,
  ASK_ANONYMOUS_PER_MINUTE,
  ASK_AUTHENTICATED_PER_DAY,
  ASK_AUTHENTICATED_PER_MINUTE,
} from '../ask.constants.js';
import { ASK_THROTTLERS, AskThrottlerGuard, clientIp } from './ask-throttler.guard.js';

class ExposedGuard extends AskThrottlerGuard {
  tracker(request: Partial<AuthenticatedRequest>): Promise<string> {
    return this.getTracker(request as AuthenticatedRequest);
  }
}

function request(headers: Record<string, string>, extra: Partial<AuthenticatedRequest> = {}) {
  return {
    header: (name: string) => headers[name],
    ip: '10.0.0.9',
    ...extra,
  } as unknown as AuthenticatedRequest;
}

function contextOf(req: AuthenticatedRequest): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => req }) } as unknown as ExecutionContext;
}

const guard = new ExposedGuard(
  { throttlers: [] } as ThrottlerModuleOptions,
  {} as ThrottlerStorage,
  {} as Reflector,
);

describe('AskThrottlerGuard', () => {
  it('tracks anonymous callers by the address the edge reports, else the socket’s', async () => {
    expect(await guard.tracker(request({ 'x-real-ip': ' 203.0.113.7 ' }))).toBe('ip:203.0.113.7');
    expect(clientIp(request({}))).toBe('10.0.0.9');
  });

  it('tracks identified callers by person, API key or agent, wherever they call from', async () => {
    const user = request(
      {},
      {
        principal: { kind: PrincipalKind.User, userId: 'user-1', name: 'A', email: 'a@x.io' },
      },
    );
    const key = request(
      {},
      {
        principal: {
          kind: PrincipalKind.ApiKey,
          apiKeyId: 'key-1',
        } as AuthenticatedRequest['principal'],
      },
    );

    const agent = request(
      {},
      {
        principal: {
          kind: PrincipalKind.Agent,
          clientId: 'https://agent.example/client.json',
          userId: 'user-1',
        } as AuthenticatedRequest['principal'],
      },
    );

    expect(await guard.tracker(user)).toBe('user:user-1');
    expect(await guard.tracker(key)).toBe('api-key:key-1');
    expect(await guard.tracker(agent)).toBe('agent:https://agent.example/client.json:user-1');
  });

  it('gives identified callers higher limits, per minute and per day', () => {
    const [minute, day] = ASK_THROTTLERS;
    const anonymous = contextOf(request({}));
    const identified = contextOf(
      request(
        {},
        { principal: { kind: PrincipalKind.ApiKey } as AuthenticatedRequest['principal'] },
      ),
    );
    const limit = (resolvable: unknown, context: ExecutionContext) =>
      (resolvable as (context: ExecutionContext) => number)(context);

    expect(limit(minute.limit, anonymous)).toBe(ASK_ANONYMOUS_PER_MINUTE);
    expect(limit(minute.limit, identified)).toBe(ASK_AUTHENTICATED_PER_MINUTE);
    expect(limit(day.limit, anonymous)).toBe(ASK_ANONYMOUS_PER_DAY);
    expect(limit(day.limit, identified)).toBe(ASK_AUTHENTICATED_PER_DAY);
  });
});
