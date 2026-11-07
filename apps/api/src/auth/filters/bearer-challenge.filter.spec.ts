import { type ArgumentsHost, HttpStatus, UnauthorizedException } from '@nestjs/common';
import type { AppConfigService } from '@crossmart/common';
import { BearerChallengeFilter } from './bearer-challenge.filter.js';

const MCP_URL = 'https://mcp.crossmart.io/mcp';
const METADATA =
  'resource_metadata="https://mcp.crossmart.io/.well-known/oauth-protected-resource/mcp"';

function hostFor(headers: Record<string, string>) {
  const response = {
    status: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  const request = { header: (name: string) => headers[name.toLowerCase()] };
  const host = {
    switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
  } as unknown as ArgumentsHost;
  return { host, response };
}

describe('BearerChallengeFilter', () => {
  const filter = new BearerChallengeFilter({ mcpPublicUrl: MCP_URL } as AppConfigService);

  it('answers a 401 with a challenge pointing to the protected resource metadata', () => {
    const { host, response } = hostFor({});

    filter.catch(new UnauthorizedException(), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    const [name, challenge] = response.set.mock.calls[0] as [string, string];
    expect(name).toBe('WWW-Authenticate');
    expect(challenge).toMatch(new RegExp(`^Bearer ${METADATA}, scope="catalog:read`));
    expect(response.json).toHaveBeenCalledWith({
      message: 'Unauthorized',
      statusCode: HttpStatus.UNAUTHORIZED,
    });
  });

  it('says invalid_token when a bearer token or an API key was refused', () => {
    const refused: Record<string, string>[] = [
      { authorization: 'Bearer expired' },
      { 'x-api-key': 'cm_wrong' },
    ];
    for (const headers of refused) {
      const { host, response } = hostFor(headers);

      filter.catch(new UnauthorizedException(), host);

      const [, challenge] = response.set.mock.calls[0] as [string, string];
      expect(challenge).toMatch(new RegExp(`^Bearer error="invalid_token", ${METADATA}`));
    }
  });
});
