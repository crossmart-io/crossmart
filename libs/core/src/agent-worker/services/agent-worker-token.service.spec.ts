import { randomUUID } from 'node:crypto';
import { SignJWT } from 'jose';
import type { AppConfigService } from '@crossmart/common';
import { AgentWorkerTokenService } from './agent-worker-token.service.js';

const SECRET = 'a'.repeat(40);

function service(secret = SECRET): AgentWorkerTokenService {
  return new AgentWorkerTokenService({ authSecret: secret } as AppConfigService);
}

describe('AgentWorkerTokenService', () => {
  const scope = { userId: randomUUID(), workspaceId: randomUUID(), conversationId: randomUUID() };

  it('verifies the tokens it issues, with their scope', async () => {
    const tokens = service();
    expect(await tokens.verify(await tokens.issue(scope))).toEqual(scope);
  });

  it('refuses a token signed with another secret', async () => {
    expect(await service().verify(await service('b'.repeat(40)).issue(scope))).toBeNull();
  });

  it('refuses a token signed with the raw secret instead of the derived key', async () => {
    const forged = await new SignJWT({ wid: scope.workspaceId, cid: scope.conversationId })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(scope.userId)
      .setAudience('crossmart:agent-worker')
      .setIssuer('crossmart-api')
      .setExpirationTime('1m')
      .sign(new TextEncoder().encode(SECRET));
    expect(await service().verify(forged)).toBeNull();
  });

  it('refuses garbage', async () => {
    expect(await service().verify('not-a-token')).toBeNull();
  });
});
