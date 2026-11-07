import type { Request } from 'express';
import { CLIENT_IP_HEADERS } from '../../auth/auth.constants.js';
import { UNKNOWN_CLIENT_IP } from './throttling.constants.js';

/** The caller's address as the edge proxy reports it, else the socket's. */
export function clientIp(request: Request): string {
  for (const header of CLIENT_IP_HEADERS) {
    const value = request.header(header);
    if (value) return value.trim();
  }
  return request.ip ?? UNKNOWN_CLIENT_IP;
}
