import {
  bearerChallenge,
  protectedResourceMetadataPaths,
  protectedResourceMetadataUrl,
} from './protected-resource-challenge.js';

const MCP_URL = 'https://mcp.crossmart.io/mcp';
const METADATA_URL = 'https://mcp.crossmart.io/.well-known/oauth-protected-resource/mcp';

describe('protected resource challenge', () => {
  it('serves the metadata at the well-known path with the resource path, then at the root', () => {
    expect(protectedResourceMetadataPaths(MCP_URL)).toEqual([
      '/.well-known/oauth-protected-resource/mcp',
      '/.well-known/oauth-protected-resource',
    ]);
  });

  it('points to the metadata on the resource’s own origin', () => {
    expect(protectedResourceMetadataUrl(MCP_URL)).toBe(METADATA_URL);
    expect(protectedResourceMetadataUrl('http://localhost:3100/mcp')).toBe(
      'http://localhost:3100/.well-known/oauth-protected-resource/mcp',
    );
  });

  it('names the metadata and every agent scope when no credential was sent', () => {
    expect(bearerChallenge(MCP_URL, false)).toBe(
      `Bearer resource_metadata="${METADATA_URL}", ` +
        'scope="catalog:read catalog:write orders:read stores:write reports:read suggestions:write webhooks:write"',
    );
  });

  it('starts with invalid_token when a credential was refused', () => {
    expect(bearerChallenge(MCP_URL, true)).toMatch(
      new RegExp(`^Bearer error="invalid_token", resource_metadata="${METADATA_URL}", scope="`),
    );
  });
});
