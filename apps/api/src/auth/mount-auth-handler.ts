import type { INestApplication } from '@nestjs/common';
import type { Express } from 'express';
import {
  AUTH_ROUTE_PATTERN,
  OAUTH_AUTHORIZATION_SERVER_METADATA_PATHS,
  OPENID_CONFIGURATION_PATHS,
} from './auth.constants.js';
import { AuthService } from './services/auth.service.js';

/**
 * Mounts Better Auth before Nest registers its body parsers, because Better Auth reads the raw
 * request body itself, plus the OAuth discovery documents at the root, where agents look for
 * them. Call before `app.init()` / `app.listen()`.
 */
export function mountAuthHandler(app: INestApplication): void {
  const authService = app.get(AuthService);
  const server = app.getHttpAdapter().getInstance() as Express;
  const metadata = authService.createMetadataHandlers();
  for (const path of OAUTH_AUTHORIZATION_SERVER_METADATA_PATHS) {
    server.get(path, metadata.authorizationServer);
  }
  for (const path of OPENID_CONFIGURATION_PATHS) {
    server.get(path, metadata.openIdConfiguration);
  }
  server.all(AUTH_ROUTE_PATTERN, authService.createHandler());
}
