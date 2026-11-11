import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Request, Response } from 'express';
import { AccessTokenVerifier } from '../auth/access-token.verifier.js';
import {
  bearerChallenge,
  protectedResourceMetadata,
  protectedResourceMetadataPaths,
} from '../auth/protected-resource.js';
import {
  CredentialProblem,
  type ResolvedCredential,
  resolveRequestCredential,
} from '../auth/request-credential.js';
import type { McpConfig } from '../config/mcp-config.js';
import { JSON_RPC_VERSION, MCP_HTTP_PATH, WWW_AUTHENTICATE_HEADER } from '../mcp.constants.js';
import { logJsonRpcRequest } from '../observability/json-rpc-log.js';
import { McpRequestLog } from '../observability/mcp-request-log.js';
import { bodyParseErrorHandler } from './body-parse-error.js';
import { createMcpServer } from '../server/create-mcp-server.js';

const UNAUTHORIZED = 401;
const METHOD_NOT_ALLOWED = 405;
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

/** What every request is served with: the settings, the token check and the request log. */
interface HttpContext {
  config: McpConfig;
  verifier: AccessTokenVerifier;
  log: McpRequestLog;
}

/** One stateless MCP exchange: a fresh server bound to the credential, closed with the response. */
async function serve(
  { config, log }: HttpContext,
  { credential, caller }: ResolvedCredential,
  request: Request,
  response: Response,
): Promise<void> {
  logJsonRpcRequest(log, caller, request.body);
  const server = createMcpServer(config.apiUrl, credential, log.observerFor(caller));
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
async function handle(context: HttpContext, request: Request, response: Response): Promise<void> {
  const { config, verifier } = context;
  const result = await resolveRequestCredential(request.headers, verifier);
  if (result.problem) {
    response.setHeader(
      WWW_AUTHENTICATE_HEADER,
      bearerChallenge(config, result.problem === CredentialProblem.Refused),
    );
    reject(response, UNAUTHORIZED, UNAUTHORIZED_MESSAGES[result.problem]);
    return;
  }
  await serve(context, result, request, response);
}

/**
 * The remote server: Streamable HTTP at `/mcp`, authenticated per request by an agent's OAuth
 * access token or an API key, plus its Protected Resource Metadata (RFC 9728).
 */
export function serveHttp(config: McpConfig): void {
  const app = createMcpExpressApp({ host: '0.0.0.0' });
  const context: HttpContext = {
    config,
    verifier: new AccessTokenVerifier(config),
    log: new McpRequestLog(),
  };
  const metadata = protectedResourceMetadata(config);
  for (const path of protectedResourceMetadataPaths(config.publicUrl)) {
    app.get(path, (_request, response) => {
      response.json(metadata);
    });
  }
  app.post(MCP_HTTP_PATH, (request, response) => {
    void handle(context, request, response);
  });
  app.all(MCP_HTTP_PATH, (_request, response) => {
    reject(response, METHOD_NOT_ALLOWED, 'This server is stateless; send requests with POST');
  });
  app.use(bodyParseErrorHandler(context.log));
  app.listen(config.port, () => {
    process.stdout.write(`Crossmart MCP server listening on port ${config.port}\n`);
  });
}
