import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Request, Response } from 'express';
import type { ApiCredential } from '../api/api-credential.js';
import { AccessTokenVerifier } from '../auth/access-token.verifier.js';
import {
  bearerChallenge,
  protectedResourceMetadata,
  protectedResourceMetadataPaths,
} from '../auth/protected-resource.js';
import { CredentialProblem, resolveRequestCredential } from '../auth/request-credential.js';
import type { McpConfig } from '../config/mcp-config.js';
import { MCP_HTTP_PATH, WWW_AUTHENTICATE_HEADER } from '../mcp.constants.js';
import { createMcpServer } from '../server/create-mcp-server.js';

const UNAUTHORIZED = 401;
const METHOD_NOT_ALLOWED = 405;
const JSON_RPC_VERSION = '2.0';
/** JSON-RPC's code for a server-defined error. */
const SERVER_ERROR_CODE = -32000;

const UNAUTHORIZED_MESSAGES: Readonly<Record<CredentialProblem, string>> = {
  [CredentialProblem.Missing]:
    'Sign in to Crossmart, or send an API key as "Authorization: Bearer <key>"',
  [CredentialProblem.Refused]: 'The access token is invalid or expired; sign in again',
};

function reject(response: Response, status: number, message: string): void {
  response
    .status(status)
    .json({ jsonrpc: JSON_RPC_VERSION, error: { code: SERVER_ERROR_CODE, message }, id: null });
}

/** One stateless MCP exchange: a fresh server bound to the credential, closed with the response. */
async function serve(
  config: McpConfig,
  credential: ApiCredential,
  request: Request,
  response: Response,
): Promise<void> {
  const server = createMcpServer(config.apiUrl, credential);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  response.on('close', () => {
    void transport.close();
    void server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(request, response, request.body);
}

/**
 * Authenticates a request, then serves it. Without a usable credential the answer is a 401 whose
 * challenge points MCP clients to this server's metadata, where the OAuth sign-in starts.
 */
async function handle(
  config: McpConfig,
  verifier: AccessTokenVerifier,
  request: Request,
  response: Response,
): Promise<void> {
  const result = await resolveRequestCredential(request.headers, verifier);
  if (result.problem) {
    response.setHeader(
      WWW_AUTHENTICATE_HEADER,
      bearerChallenge(config, result.problem === CredentialProblem.Refused),
    );
    reject(response, UNAUTHORIZED, UNAUTHORIZED_MESSAGES[result.problem]);
    return;
  }
  await serve(config, result.credential, request, response);
}

/**
 * The remote server: Streamable HTTP at `/mcp`, authenticated per request by an agent's OAuth
 * access token or an API key, plus its Protected Resource Metadata (RFC 9728).
 */
export function serveHttp(config: McpConfig): void {
  const app = createMcpExpressApp({ host: '0.0.0.0' });
  const verifier = new AccessTokenVerifier(config);
  const metadata = protectedResourceMetadata(config);
  for (const path of protectedResourceMetadataPaths(config.publicUrl)) {
    app.get(path, (_request, response) => {
      response.json(metadata);
    });
  }
  app.post(MCP_HTTP_PATH, (request, response) => {
    void handle(config, verifier, request, response);
  });
  app.all(MCP_HTTP_PATH, (_request, response) => {
    reject(response, METHOD_NOT_ALLOWED, 'This server is stateless; send requests with POST');
  });
  app.listen(config.port, () => {
    process.stdout.write(`Crossmart MCP server listening on port ${config.port}\n`);
  });
}
