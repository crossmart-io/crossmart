import { type INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { API_DEFAULT_VERSION, API_GLOBAL_PREFIX, AppConfigService } from '@crossmart/common';
import { mountAuthHandler } from '../auth/mount-auth-handler.js';
import { corsPolicy } from './cors-policy.js';
import { mountMediaFiles } from './mount-media-files.js';

/**
 * Applies the HTTP conventions shared by the running server and the e2e tests:
 * `/api/v1/...` routes, Better Auth at `/api/auth`, uploaded media at `/media`, strict DTO
 * validation, security headers and CORS (trusted origins only, except public routes such as Ask).
 */
export function configureApplication(app: INestApplication): void {
  const appConfig = app.get(AppConfigService);

  app.setGlobalPrefix(API_GLOBAL_PREFIX);
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
