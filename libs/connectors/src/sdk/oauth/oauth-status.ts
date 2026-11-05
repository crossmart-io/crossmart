import { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_UNAUTHORIZED } from '../http/http.constants.js';

/** A token endpoint refuses a grant with 400, or 401 when it also checked the client (RFC 6749 §5.2). */
export function isRejectedGrantStatus(status: number): boolean {
  return status === HTTP_STATUS_BAD_REQUEST || status === HTTP_STATUS_UNAUTHORIZED;
}
