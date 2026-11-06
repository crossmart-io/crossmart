import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppConfigService, OPENAPI_ONLY_FLAG } from '@crossmart/common';
import { BACKFILL_UPLOADS_FLAG } from '@crossmart/core';
import { ApiModule } from './api.module.js';
import { configureApplication } from './bootstrap/configure-application.js';
import {
  buildOpenApiDocument,
  serveOpenApiDocs,
  writeOpenApiDocument,
} from './bootstrap/openapi.js';
import { backfillUploads } from './media/backfill-uploads.js';

const APP_VERSION = process.env.npm_package_version ?? '0.0.0';

async function bootstrap(): Promise<void> {
  if (process.argv.includes(BACKFILL_UPLOADS_FLAG)) {
    await backfillUploads();
    return;
  }

  // Webhook signatures are computed over the raw body, so it is kept next to the parsed one.
  const app = await NestFactory.create(ApiModule, { rawBody: true });
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
