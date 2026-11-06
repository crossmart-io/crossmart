import {
  bearerChallenge,
  protectedResourceMetadata,
  protectedResourceMetadataPaths,
} from './protected-resource.js';

const CONFIG = {
  publicUrl: 'https://mcp.crossmart.io/mcp',
  authIssuer: 'https://api.crossmart.io/api/auth',
};

describe('protected resource metadata', () => {
  it('names this server and the API as its authorization server', () => {
    expect(protectedResourceMetadata(CONFIG)).toMatchObject({
      resource: CONFIG.publicUrl,
      authorization_servers: [CONFIG.authIssuer],
      bearer_methods_supported: ['header'],
    });
    expect(protectedResourceMetadata(CONFIG).scopes_supported).toContain('catalog:read');
  });

  it('is served at the well-known path with the resource path, and at the root', () => {
    expect(protectedResourceMetadataPaths(CONFIG.publicUrl)).toEqual([
      '/.well-known/oauth-protected-resource/mcp',
      '/.well-known/oauth-protected-resource',
    ]);
  });

  it('points a 401 to the metadata, and says when a token was refused', () => {
    const challenge = bearerChallenge(CONFIG, false);
    expect(challenge).toMatch(
      /^Bearer resource_metadata="https:\/\/mcp\.crossmart\.io\/\.well-known\/oauth-protected-resource\/mcp"/,
    );
    expect(challenge).toContain('scope="catalog:read');
    expect(bearerChallenge(CONFIG, true)).toMatch(/^Bearer error="invalid_token", /);
  });
});
