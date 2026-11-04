import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Request, Response } from 'express';
import type { McpConfig } from '../config/mcp-config.js';
import { MCP_HTTP_PATH } from '../mcp.constants.js';
import { createMcpServer } from '../server/create-mcp-server.js';
import { requestApiKey } from './request-api-key.js';

const UNAUTHORIZED = 401;
const METHOD_NOT_ALLOWED = 405;
const JSON_RPC_VERSION = '2.0';
/** JSON-RPC's code for a server-defined error. */
const SERVER_ERROR_CODE = -32000;

function reject(response: Response, status: number, message: string): void {
  response
    .status(status)
    .json({ jsonrpc: JSON_RPC_VERSION, error: { code: SERVER_ERROR_CODE, message }, id: null });
}

/**
 * One stateless MCP exchange: a fresh server bound to the request's API key, closed when the
 * response ends. No session is kept, so any instance can answer any request.
 */
async function handle(config: McpConfig, request: Request, response: Response): Promise<void> {
  const apiKey = requestApiKey(request.headers);
  if (!apiKey) {
    reject(response, UNAUTHORIZED, 'Send a Crossmart API key as "Authorization: Bearer <key>"');
    return;
  }
  const server = createMcpServer(config.apiUrl, apiKey);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  response.on('close', () => {
    void transport.close();
    void server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(request, response, request.body);
}

/** The remote server: Streamable HTTP at `/mcp`, one API key per request. */
export function serveHttp(config: McpConfig): void {
  const app = createMcpExpressApp({ host: '0.0.0.0' });
  app.post(MCP_HTTP_PATH, (request, response) => {
    void handle(config, request, response);
  });
  app.all(MCP_HTTP_PATH, (_request, response) => {
    reject(response, METHOD_NOT_ALLOWED, 'This server is stateless; send requests with POST');
  });
  app.listen(config.port, () => {
    process.stdout.write(`Crossmart MCP server listening on port ${config.port}\n`);
  });
}
