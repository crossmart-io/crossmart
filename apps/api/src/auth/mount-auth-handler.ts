import type { INestApplication } from '@nestjs/common';
import type { Express } from 'express';
import { AUTH_ROUTE_PATTERN } from './auth.constants.js';
import { AuthService } from './services/auth.service.js';

/**
 * Mounts Better Auth before Nest registers its body parsers, because Better Auth reads the raw
 * request body itself. Call before `app.init()` / `app.listen()`.
 */
export function mountAuthHandler(app: INestApplication): void {
  const handler = app.get(AuthService).createHandler();
  const server = app.getHttpAdapter().getInstance() as Express;
  server.all(AUTH_ROUTE_PATTERN, handler);
}
