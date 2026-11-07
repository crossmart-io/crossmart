import { agentAuthMetadata, withAgentAuth } from './agent-auth-metadata.js';

const API_URL = 'https://api.crossmart.io';
const BETTER_AUTH_METADATA = {
  issuer: 'https://api.crossmart.io/api/auth',
  revocation_endpoint: 'https://api.crossmart.io/api/auth/oauth2/revoke',
};
const CACHE_CONTROL = 'public, max-age=15';

function metadataHandler(status: number) {
  return () =>
    Promise.resolve(
      Response.json(BETTER_AUTH_METADATA, { status, headers: { 'Cache-Control': CACHE_CONTROL } }),
    );
}

describe('agent_auth metadata (auth.md)', () => {
  it('names the auth.md file and the sandbox endpoint, and no profile identity types', () => {
    expect(agentAuthMetadata(API_URL)).toEqual({
      skill: 'https://crossmart.io/auth.md',
      identity_types_supported: [],
      sandbox_account_endpoint: 'https://api.crossmart.io/api/v1/sandbox-accounts',
    });
  });

  it('builds the sandbox endpoint on a self-hosted API’s own address', () => {
    expect(agentAuthMetadata('http://localhost:3000').sandbox_account_endpoint).toBe(
      'http://localhost:3000/api/v1/sandbox-accounts',
    );
  });

  it('adds the block to Better Auth’s metadata and keeps its fields and headers', async () => {
    const handler = withAgentAuth(metadataHandler(200), agentAuthMetadata(API_URL));

    const response = await handler(
      new Request(`${API_URL}/.well-known/oauth-authorization-server`),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(CACHE_CONTROL);
    expect(await response.json()).toEqual({
      ...BETTER_AUTH_METADATA,
      agent_auth: agentAuthMetadata(API_URL),
    });
  });

  it('passes an error answer through unchanged', async () => {
    const handler = withAgentAuth(metadataHandler(500), agentAuthMetadata(API_URL));

    const response = await handler(
      new Request(`${API_URL}/.well-known/oauth-authorization-server`),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual(BETTER_AUTH_METADATA);
  });
});
