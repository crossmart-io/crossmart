import {
  type INestApplication,
  RequestMethod,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import helmet from 'helmet';
import { API_DEFAULT_VERSION, API_GLOBAL_PREFIX, AppConfigService } from '@crossmart/common';
import { A2A_ROUTE, AGENT_CARD_ROUTE } from '../a2a/a2a.constants.js';
import { mountAuthHandler } from '../auth/mount-auth-handler.js';
import { corsPolicy } from './cors-policy.js';
import { mountMediaFiles } from './mount-media-files.js';

/** Routes at the root, where agents look for them, outside `/api/v1`: A2A (ADR 0025). */
const ROOT_ROUTES = [
  { path: AGENT_CARD_ROUTE, method: RequestMethod.GET },
  { path: A2A_ROUTE, method: RequestMethod.POST },
];

/**
 * Applies the HTTP conventions shared by the running server and the e2e tests:
 * `/api/v1/...` routes (A2A's at the root), Better Auth at `/api/auth`, uploaded media at `/media`, strict DTO
 * validation, security headers and CORS (trusted origins only, except public routes such as Ask).
 */
export function configureApplication(app: INestApplication): void {
  const appConfig = app.get(AppConfigService);

  app.setGlobalPrefix(API_GLOBAL_PREFIX, { exclude: ROOT_ROUTES });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: API_DEFAULT_VERSION });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.use(helmet());
  app.enableCors(corsPolicy(appConfig.corsOrigins));
  mountAuthHandler(app);
  mountMediaFiles(app);
  app.enableShutdownHooks();
}
