import { AgentScope } from '@crossmart/core/agents/enums/agent-scope.enum.js';
import type { AccessTokenVerifier } from './access-token.verifier.js';
import { CredentialProblem, resolveRequestCredential } from './request-credential.js';

function verifierReturning(claims: Awaited<ReturnType<AccessTokenVerifier['verify']>>) {
  return { verify: vi.fn().mockResolvedValue(claims) } as unknown as AccessTokenVerifier;
}

describe('resolveRequestCredential', () => {
  it('asks for a sign-in when nothing is sent', async () => {
    await expect(resolveRequestCredential({}, verifierReturning(null))).resolves.toEqual({
      problem: CredentialProblem.Missing,
    });
  });

  it('passes an API key on for the API to check', async () => {
    const result = await resolveRequestCredential(
      { authorization: 'Bearer cm_secret' },
      verifierReturning(null),
    );
    expect(result.credential).toEqual({ headers: { 'x-api-key': 'cm_secret' } });
  });

  it('accepts a verified agent token with its workspace and scopes', async () => {
    const claims = { workspaceId: 'ws-1', scopes: [AgentScope.OrdersRead] };
    const result = await resolveRequestCredential(
      { authorization: 'Bearer a.b.c' },
      verifierReturning(claims),
    );
    expect(result.credential).toEqual({
      headers: { authorization: 'Bearer a.b.c' },
      workspaceId: 'ws-1',
      scopes: [AgentScope.OrdersRead],
    });
  });

  it('refuses an agent token that does not verify', async () => {
    await expect(
      resolveRequestCredential({ authorization: 'Bearer a.b.c' }, verifierReturning(null)),
    ).resolves.toEqual({ problem: CredentialProblem.Refused });
  });
});
