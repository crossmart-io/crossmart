import { agentAuthMetadata, withAgentAuth } from './agent-auth-metadata.js';

const API_URL = 'https://api.crossmart.io';
const URLS = { apiPublicUrl: API_URL, webAppUrl: 'https://app.crossmart.io' };
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
  it('describes the sandbox account as a verified-email registration that returns an API key', () => {
    expect(agentAuthMetadata(URLS)).toEqual({
      skill: 'https://crossmart.io/auth.md',
      register_uri: 'https://api.crossmart.io/api/v1/sandbox-accounts',
      claim_uri: 'https://app.crossmart.io/claim',
      identity_types_supported: ['identity_assertion'],
      identity_assertion: {
        assertion_types_supported: ['verified_email'],
        credential_types_supported: ['api_key'],
      },
    });
  });

  it('declares no ID-JAG, revocation URI or security events, which Crossmart does not support', () => {
    const metadata = agentAuthMetadata(URLS);

    expect(metadata.identity_assertion.assertion_types_supported).not.toContain(
      'urn:ietf:params:oauth:token-type:id-jag',
    );
    expect(metadata).not.toHaveProperty('revocation_uri');
    expect(metadata).not.toHaveProperty('events_supported');
  });

  it('builds the URLs on a self-hosted instance’s own addresses', () => {
    const metadata = agentAuthMetadata({
      apiPublicUrl: 'http://localhost:3000',
      webAppUrl: 'http://localhost:5173',
    });

    expect(metadata.register_uri).toBe('http://localhost:3000/api/v1/sandbox-accounts');
    expect(metadata.claim_uri).toBe('http://localhost:5173/claim');
  });

  it('adds the block to Better Auth’s metadata and keeps its fields and headers', async () => {
    const handler = withAgentAuth(metadataHandler(200), agentAuthMetadata(URLS));

    const response = await handler(
      new Request(`${API_URL}/.well-known/oauth-authorization-server`),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(CACHE_CONTROL);
    expect(await response.json()).toEqual({
      ...BETTER_AUTH_METADATA,
      agent_auth: agentAuthMetadata(URLS),
    });
  });

  it('passes an error answer through unchanged', async () => {
    const handler = withAgentAuth(metadataHandler(500), agentAuthMetadata(URLS));

    const response = await handler(
      new Request(`${API_URL}/.well-known/oauth-authorization-server`),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual(BETTER_AUTH_METADATA);
  });
});
