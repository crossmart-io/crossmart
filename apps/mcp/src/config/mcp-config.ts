import {
  AUTH_BASE_PATH,
  DEFAULT_CROSSMART_API_URL,
  DEFAULT_MCP_HTTP_PORT,
  MCP_ENV,
  MCP_HTTP_PATH,
  McpTransportKind,
} from '../mcp.constants.js';

export interface McpConfig {
  apiUrl: string;
  transport: McpTransportKind;
  /** The local server's key; absent for the remote server. */
  apiKey: string | undefined;
  port: number;
  /** The remote server's public address with its path: what agent tokens are issued for. */
  publicUrl: string;
  /** The issuer of agent access tokens, and where its keys are. */
  authIssuer: string;
}

function toTransport(value: string | undefined): McpTransportKind {
  return Object.values(McpTransportKind).find((kind) => kind === value) ?? McpTransportKind.Stdio;
}

function withoutTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/** The server's settings, from the environment. */
export function readMcpConfig(env: NodeJS.ProcessEnv = process.env): McpConfig {
  const parsedPort = Number(env[MCP_ENV.port]);
  const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : DEFAULT_MCP_HTTP_PORT;
  const apiUrl = env[MCP_ENV.apiUrl] ?? DEFAULT_CROSSMART_API_URL;
  return {
    apiUrl,
    transport: toTransport(env[MCP_ENV.transport]),
    apiKey: env[MCP_ENV.apiKey] || undefined,
    port,
    publicUrl: env[MCP_ENV.publicUrl] || `http://localhost:${port}${MCP_HTTP_PATH}`,
    authIssuer: withoutTrailingSlash(
      env[MCP_ENV.authIssuer] || `${withoutTrailingSlash(apiUrl)}${AUTH_BASE_PATH}`,
    ),
  };
}
