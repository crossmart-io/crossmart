import type {
  CorsOptions,
  CorsOptionsDelegate,
} from '@nestjs/common/interfaces/external/cors-options.interface.js';
import type { Request } from 'express';
import { PUBLIC_CORS_OPTIONS, PUBLIC_CORS_PATHS } from './cors.constants.js';

const TRAILING_SLASHES = /\/+$/;

/** Whether a request path is one of the routes any website may call (`PUBLIC_CORS_PATHS`). */
export function isPublicCorsPath(path: string): boolean {
  return PUBLIC_CORS_PATHS.has(path.replace(TRAILING_SLASHES, ''));
}

/**
 * The API's CORS policy, per request: public routes such as Ask accept any origin without
 * credentials; every other route accepts only the trusted origins (`CORS_ORIGINS`, also Better
 * Auth's trusted origins), with credentials, as before.
 */
export function corsPolicy(trustedOrigins: readonly string[]): CorsOptionsDelegate<Request> {
  const trusted: CorsOptions = { origin: [...trustedOrigins], credentials: true };
  return (request, callback) => {
    callback(null, isPublicCorsPath(request.path) ? PUBLIC_CORS_OPTIONS : trusted);
  };
}
