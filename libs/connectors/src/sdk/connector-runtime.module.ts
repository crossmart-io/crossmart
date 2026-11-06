import { Module } from '@nestjs/common';
import { FetchHttpTransport } from './http/fetch-http-transport.js';
import { HttpTransport } from './http/http-transport.js';
import { HttpsImageFetcher } from './images/https-image-fetcher.js';
import { ImageFetcher } from './images/image-fetcher.js';
import { Sleeper, TimerSleeper } from './time/sleeper.js';

/**
 * What every connector needs at runtime. Tests override `HttpTransport` with fixtures, and
 * `ImageFetcher` for channels that upload image files.
 */
@Module({
  providers: [
    { provide: HttpTransport, useClass: FetchHttpTransport },
    { provide: Sleeper, useClass: TimerSleeper },
    { provide: ImageFetcher, useClass: HttpsImageFetcher },
  ],
  exports: [HttpTransport, Sleeper, ImageFetcher],
})
export class ConnectorRuntimeModule {}
