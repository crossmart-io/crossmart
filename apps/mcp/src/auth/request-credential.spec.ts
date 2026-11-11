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

  it('names an API key by its visible prefix only, for the request log', async () => {
    const result = await resolveRequestCredential(
      { authorization: 'Bearer cm_abcdefgh_the_rest_is_secret' },
      verifierReturning(null),
    );
    expect(result.caller).toEqual({ kind: 'api_key', principalId: 'cm_abcdefg' });
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

  it('names an agent by its user, client and workspace, for the request log', async () => {
    const claims = {
      workspaceId: 'ws-1',
      scopes: [AgentScope.OrdersRead],
      userId: 'user-1',
      clientId: 'https://claude.ai/oauth/client.json',
    };
    const result = await resolveRequestCredential(
      { authorization: 'Bearer a.b.c' },
      verifierReturning(claims),
    );
    expect(result.caller).toEqual({
      kind: 'agent',
      workspaceId: 'ws-1',
      principalId: 'user-1',
      clientId: 'https://claude.ai/oauth/client.json',
    });
  });

  it('refuses an agent token that does not verify', async () => {
    await expect(
      resolveRequestCredential({ authorization: 'Bearer a.b.c' }, verifierReturning(null)),
    ).resolves.toEqual({ problem: CredentialProblem.Refused });
  });
});
