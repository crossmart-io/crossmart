import { type INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { API_DEFAULT_VERSION, API_GLOBAL_PREFIX, AppConfigService } from '@crossmart/common';

/**
 * Applies the HTTP conventions shared by the running server and the e2e tests:
 * `/api/v1/...` routes, strict DTO validation, security headers and CORS.
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
  app.enableCors({ origin: appConfig.corsOrigins, credentials: true });
  app.enableShutdownHooks();
}
