import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import type { AppConfigService } from '@crossmart/common';
import { AgentScope } from '@crossmart/core';
import { AgentTokenVerifier } from './agent-token.verifier.js';
import type { AuthService } from './auth.service.js';

const ISSUER = 'https://api.crossmart.test/api/auth';
const MCP_URL = 'https://mcp.crossmart.test/mcp';
const KEY_ID = 'key-1';

async function setup() {
  const { publicKey, privateKey } = await generateKeyPair('EdDSA');
  const jwk = { ...(await exportJWK(publicKey)), kid: KEY_ID, alg: 'EdDSA' };
  const auth = {
    agentTokenKeys: vi.fn().mockResolvedValue({ issuer: ISSUER, jwks: { keys: [jwk] } }),
  };
  const verifier = new AgentTokenVerifier(
    auth as unknown as AuthService,
    { mcpPublicUrl: MCP_URL } as AppConfigService,
  );
  const sign = (claims: Record<string, unknown>, audience = MCP_URL) =>
    new SignJWT(claims)
      .setProtectedHeader({ alg: 'EdDSA', kid: KEY_ID })
      .setIssuer(ISSUER)
      .setAudience(audience)
      .setSubject('user-1')
      .setExpirationTime('1h')
      .sign(privateKey);
  return { verifier, sign, auth };
}

const CLAIMS = {
  client_id: 'https://claude.ai/oauth/client.json',
  scope: 'catalog:read offline_access',
  'https://crossmart.io/workspace_id': 'ws-1',
};

describe('AgentTokenVerifier', () => {
  it('reads the grant of a token issued for the MCP server', async () => {
    const { verifier, sign } = await setup();

    await expect(verifier.verify(await sign(CLAIMS))).resolves.toEqual({
      userId: 'user-1',
      clientId: CLAIMS.client_id,
      workspaceId: 'ws-1',
      scopes: [AgentScope.CatalogRead],
    });
  });

  it('refuses tokens for another audience, without a workspace or scope, and garbage', async () => {
    const { verifier, sign } = await setup();

    await expect(verifier.verify(await sign(CLAIMS, 'https://elsewhere.test'))).resolves.toBeNull();
    await expect(
      verifier.verify(await sign({ ...CLAIMS, 'https://crossmart.io/workspace_id': undefined })),
    ).resolves.toBeNull();
    await expect(verifier.verify(await sign({ ...CLAIMS, scope: 'openid' }))).resolves.toBeNull();
    await expect(verifier.verify('not.a.token')).resolves.toBeNull();
  });

  it('reads the keys once while they are fresh', async () => {
    const { verifier, sign, auth } = await setup();

    await verifier.verify(await sign(CLAIMS));
    await verifier.verify(await sign(CLAIMS));

    expect(auth.agentTokenKeys).toHaveBeenCalledTimes(1);
  });
});
