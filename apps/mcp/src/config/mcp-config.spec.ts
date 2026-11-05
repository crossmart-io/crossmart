import {
  DEFAULT_CROSSMART_API_URL,
  DEFAULT_MCP_HTTP_PORT,
  McpTransportKind,
} from '../mcp.constants.js';
import { readMcpConfig } from './mcp-config.js';

describe('readMcpConfig', () => {
  it('runs locally over stdio by default', () => {
    expect(readMcpConfig({})).toEqual({
      apiUrl: DEFAULT_CROSSMART_API_URL,
      transport: McpTransportKind.Stdio,
      apiKey: undefined,
      port: DEFAULT_MCP_HTTP_PORT,
      publicUrl: `http://localhost:${DEFAULT_MCP_HTTP_PORT}/mcp`,
      authIssuer: `${DEFAULT_CROSSMART_API_URL}/api/auth`,
    });
  });

  it('takes the public address and token issuer it is given, for a server behind a proxy', () => {
    const config = readMcpConfig({
      CROSSMART_API_URL: 'http://api.railway.internal:8080',
      MCP_PUBLIC_URL: 'https://mcp.crossmart.io/mcp',
      CROSSMART_AUTH_ISSUER: 'https://api.crossmart.io/api/auth/',
    });
    expect(config).toMatchObject({
      publicUrl: 'https://mcp.crossmart.io/mcp',
      authIssuer: 'https://api.crossmart.io/api/auth',
    });
  });

  it('serves over HTTP on the port it is given', () => {
    const config = readMcpConfig({
      MCP_TRANSPORT: 'http',
      PORT: '8080',
      CROSSMART_API_URL: 'https://api.crossmart.io',
    });
    expect(config).toMatchObject({ transport: McpTransportKind.Http, port: 8080 });
  });

  it('ignores an unknown transport and a bad port', () => {
    const config = readMcpConfig({ MCP_TRANSPORT: 'carrier-pigeon', PORT: 'abc' });
    expect(config).toMatchObject({
      transport: McpTransportKind.Stdio,
      port: DEFAULT_MCP_HTTP_PORT,
    });
  });
});
