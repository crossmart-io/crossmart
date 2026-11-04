import type { INestApplication } from '@nestjs/common';
import express, { type Response } from 'express';
import { FileStorage, LocalFileStorage, MEDIA_ROUTE_PREFIX } from '@crossmart/common';

const ONE_YEAR_SECONDS = 31_536_000;

/** Stored file names are random and never reused, so they can be cached forever. */
function setMediaHeaders(response: Response): void {
  // The web app and marketplaces load these images from other origins.
  response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  response.setHeader('Cache-Control', `public, max-age=${ONE_YEAR_SECONDS}, immutable`);
  response.setHeader('X-Content-Type-Options', 'nosniff');
}

/** Serves locally stored uploads. Object storage (S3, R2) serves its own files instead. */
export function mountMediaFiles(app: INestApplication): void {
  const storage = app.get(FileStorage);
  if (!(storage instanceof LocalFileStorage)) {
    return;
  }
  app.use(
    MEDIA_ROUTE_PREFIX,
    express.static(storage.directory, {
      dotfiles: 'deny',
      fallthrough: false,
      index: false,
      setHeaders: setMediaHeaders,
    }),
  );
}
