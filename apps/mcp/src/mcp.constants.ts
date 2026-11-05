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
} as const;

export enum McpTransportKind {
  /** A local process an MCP client starts, such as Claude Desktop. */
  Stdio = 'stdio',
  /** A remote server, reached over Streamable HTTP. */
  Http = 'http',
}

export const API_PREFIX = '/api/v1';
export const WORKSPACE_PATH = `${API_PREFIX}/workspaces/{workspaceId}`;
export const CURRENT_API_KEY_PATH = `${API_PREFIX}/api-key`;
export const API_HEALTH_PATH = `${API_PREFIX}/health`;
export const API_KEY_HEADER = 'x-api-key';
export const BEARER_PREFIX = 'Bearer ';
export const JSON_INDENTATION = 2;

/** Input limits; the API enforces its own as well. */
export const MAX_PAGE_SIZE = 100;
export const SEARCH_MAX_LENGTH = 200;
export const NOTE_MAX_LENGTH = 500;
/** Products one generate_content call may name; the API's own limit. */
export const CONTENT_GENERATION_MAX_PRODUCTS = 100;
