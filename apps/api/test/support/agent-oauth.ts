import { createHash, randomBytes } from 'node:crypto';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import type { SignedUpUser } from './test-app.js';

/** A desktop agent's loopback callback, which registers as a native client. */
export const AGENT_REDIRECT_URI = 'http://127.0.0.1:9999/callback';
/** The MCP server the test API issues tokens for (`MCP_PUBLIC_URL`'s default). */
export const MCP_RESOURCE = 'http://localhost:3100/mcp';
export const FULL_AGENT_SCOPE =
  'catalog:read catalog:write orders:read stores:write reports:read suggestions:write offline_access';

export interface AgentTokens {
  accessToken: string;
  refreshToken: string;
  scope: string;
}

export interface ConnectAgentOptions {
  clientId: string;
  /** The workspace the user picks; their first one by default. */
  workspaceId?: string;
  scope?: string;
  /** Scopes the user accepts on the consent page; all requested ones by default. */
  acceptedScope?: string;
}

/** Registers a public client the way an MCP client without CIMD does (RFC 7591). */
export async function registerAgent(app: INestApplication<App>, name: string): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/api/auth/oauth2/register')
    .send({
      client_name: name,
      redirect_uris: [AGENT_REDIRECT_URI],
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
    });
  expect(response.status).toBe(HttpStatus.CREATED);
  return response.body.client_id as string;
}

function signedQuery(url: string): string {
  return new URL(url).search.slice(1);
}

/**
 * Runs the whole browser side of an agent's authorization as the web app would: authorize, pick
 * the workspace, continue, consent, then trade the code for tokens with PKCE.
 */
export async function connectAgent(
  app: INestApplication<App>,
  user: SignedUpUser,
  options: ConnectAgentOptions,
): Promise<AgentTokens> {
  const server = app.getHttpServer();
  const verifier = randomBytes(32).toString('base64url');
  const authorize = await request(server)
    .get('/api/auth/oauth2/authorize')
    .query({
      response_type: 'code',
      client_id: options.clientId,
      redirect_uri: AGENT_REDIRECT_URI,
      scope: options.scope ?? FULL_AGENT_SCOPE,
      state: 'state-1',
      code_challenge: createHash('sha256').update(verifier).digest('base64url'),
      code_challenge_method: 'S256',
      resource: MCP_RESOURCE,
    })
    .set('Cookie', user.cookie);
  expect(authorize.status).toBe(HttpStatus.FOUND);
  expect(authorize.headers.location).toContain('/oauth/workspace?');

  const pick = await request(server)
    .post('/api/v1/oauth/workspace')
    .set('Cookie', user.cookie)
    .send({ workspaceId: options.workspaceId ?? user.workspaceId });
  expect(pick.status).toBe(HttpStatus.NO_CONTENT);

  const resume = await request(server)
    .post('/api/auth/oauth2/continue')
    .set('Cookie', user.cookie)
    .send({ postLogin: true, oauth_query: signedQuery(authorize.headers.location) });
  expect(resume.body.url).toContain('/oauth/consent?');

  const consent = await request(server)
    .post('/api/auth/oauth2/consent')
    .set('Cookie', user.cookie)
    .send({
      accept: true,
      oauth_query: signedQuery(resume.body.url),
      ...(options.acceptedScope ? { scope: options.acceptedScope } : {}),
    });
  const code = new URL(consent.body.url as string).searchParams.get('code');
  expect(code).toBeTruthy();

  const token = await request(server).post('/api/auth/oauth2/token').type('form').send({
    grant_type: 'authorization_code',
    code,
    redirect_uri: AGENT_REDIRECT_URI,
    client_id: options.clientId,
    code_verifier: verifier,
    resource: MCP_RESOURCE,
  });
  expect(token.status).toBe(HttpStatus.OK);
  return {
    accessToken: token.body.access_token,
    refreshToken: token.body.refresh_token,
    scope: token.body.scope,
  };
}
