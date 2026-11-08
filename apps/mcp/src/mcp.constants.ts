export const MCP_SERVER_NAME = 'crossmart';
export const DEFAULT_CROSSMART_API_URL = 'http://localhost:3000';
export const DEFAULT_MCP_HTTP_PORT = 3100;
/** Where the remote server answers MCP requests. */
export const MCP_HTTP_PATH = '/mcp';

/** Environment variables the server reads. */
export const MCP_ENV = {
  apiUrl: 'CROSSMART_API_URL',
  /** The API key the local (stdio) server uses; the remote server takes one per request. */
  apiKey: 'CROSSMART_API_KEY',
  transport: 'MCP_TRANSPORT',
  port: 'PORT',
  /** This server's public address with its path: the audience of agent access tokens. */
  publicUrl: 'MCP_PUBLIC_URL',
  /** Who issues agent access tokens: the API's public auth URL, when it differs from the API's. */
  authIssuer: 'CROSSMART_AUTH_ISSUER',
} as const;

export enum McpTransportKind {
  /** A local process an MCP client starts, such as Claude Desktop. */
  Stdio = 'stdio',
  /** A remote server, reached over Streamable HTTP. */
  Http = 'http',
}

/** Where the API's OAuth server lives under its base URL, and its signing keys under that. */
export const AUTH_BASE_PATH = '/api/auth';
export const JWKS_PATH = '/jwks';
export const WWW_AUTHENTICATE_HEADER = 'WWW-Authenticate';
/** The access-token claim naming the agent's workspace (the API's `AGENT_WORKSPACE_CLAIM`). */
export const SCOPE_CLAIM = 'scope';
export const SCOPE_SEPARATOR = ' ';
/** A JWT has three dot-separated parts; API keys have none. */
export const JWT_PART_COUNT = 3;
export const JWT_SEPARATOR = '.';
export const RESOURCE_NAME = 'Crossmart';
