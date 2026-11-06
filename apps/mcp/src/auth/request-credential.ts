import type { IncomingHttpHeaders } from 'node:http';
import {
  accessTokenCredential,
  type ApiCredential,
  apiKeyCredential,
} from '../api/api-credential.js';
import { JWT_PART_COUNT, JWT_SEPARATOR } from '../mcp.constants.js';
import { requestToken } from '../transports/request-token.js';
import type { AccessTokenVerifier } from './access-token.verifier.js';

/** Why a request has no usable credential, which decides the 401's challenge. */
export enum CredentialProblem {
  Missing = 'missing',
  Refused = 'refused',
}

export type CredentialResult =
  | { credential: ApiCredential; problem?: never }
  | { credential?: never; problem: CredentialProblem };

function looksLikeJwt(token: string): boolean {
  return token.split(JWT_SEPARATOR).length === JWT_PART_COUNT;
}

/**
 * The credential a remote request carries: an agent's OAuth access token (a JWT, verified here),
 * or a workspace API key, which the API checks on each call.
 */
export async function resolveRequestCredential(
  headers: IncomingHttpHeaders,
  verifier: AccessTokenVerifier,
): Promise<CredentialResult> {
  const token = requestToken(headers);
  if (!token) return { problem: CredentialProblem.Missing };
  if (!looksLikeJwt(token)) return { credential: apiKeyCredential(token) };
  const claims = await verifier.verify(token);
  return claims
    ? { credential: accessTokenCredential(token, claims.workspaceId, claims.scopes) }
    : { problem: CredentialProblem.Refused };
}
