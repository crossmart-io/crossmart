import {
  DEFAULT_CROSSMART_API_URL,
  DEFAULT_MCP_HTTP_PORT,
  MCP_ENV,
  McpTransportKind,
} from '../mcp.constants.js';

export interface McpConfig {
  apiUrl: string;
  transport: McpTransportKind;
  /** The local server's key; absent for the remote server. */
  apiKey: string | undefined;
  port: number;
}

function toTransport(value: string | undefined): McpTransportKind {
  return Object.values(McpTransportKind).find((kind) => kind === value) ?? McpTransportKind.Stdio;
}

/** The server's settings, from the environment. */
export function readMcpConfig(env: NodeJS.ProcessEnv = process.env): McpConfig {
  const port = Number(env[MCP_ENV.port]);
  return {
    apiUrl: env[MCP_ENV.apiUrl] ?? DEFAULT_CROSSMART_API_URL,
    transport: toTransport(env[MCP_ENV.transport]),
    apiKey: env[MCP_ENV.apiKey] || undefined,
    port: Number.isInteger(port) && port > 0 ? port : DEFAULT_MCP_HTTP_PORT,
  };
}
