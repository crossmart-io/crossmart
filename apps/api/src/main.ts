import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppConfigService, OPENAPI_ONLY_FLAG } from '@crossmart/common';
import { ApiModule } from './api.module.js';
import { configureApplication } from './bootstrap/configure-application.js';
import {
  buildOpenApiDocument,
  serveOpenApiDocs,
  writeOpenApiDocument,
} from './bootstrap/openapi.js';

const APP_VERSION = process.env.npm_package_version ?? '0.0.0';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(ApiModule);
  configureApplication(app);

  const openApiDocument = buildOpenApiDocument(app, APP_VERSION);

  if (process.argv.includes(OPENAPI_ONLY_FLAG)) {
    await writeOpenApiDocument(openApiDocument);
    await app.close();
    return;
  }

  serveOpenApiDocs(app, openApiDocument);

  const { apiPort } = app.get(AppConfigService);
  await app.listen(apiPort);
  Logger.log(`Crossmart API listening on port ${apiPort}`, 'Bootstrap');
}

await bootstrap();
