import type { IncomingHttpHeaders } from 'node:http';
import { API_KEY_HEADER, BEARER_PREFIX } from '../mcp.constants.js';

/**
 * The token a remote request carries: `Authorization: Bearer <token>` (an agent's access token or
 * an API key), or an API key in `x-api-key`.
 */
export function requestToken(headers: IncomingHttpHeaders): string | undefined {
  const authorization = headers.authorization;
  if (authorization?.startsWith(BEARER_PREFIX)) {
    return authorization.slice(BEARER_PREFIX.length).trim() || undefined;
  }
  const header = headers[API_KEY_HEADER];
  return (Array.isArray(header) ? header[0] : header) || undefined;
}
