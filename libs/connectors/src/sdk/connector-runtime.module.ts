import { Module } from '@nestjs/common';
import { FetchHttpTransport } from './http/fetch-http-transport.js';
import { HttpTransport } from './http/http-transport.js';
import { Sleeper, TimerSleeper } from './time/sleeper.js';

/** What every connector needs at runtime. Tests override `HttpTransport` with fixtures. */
@Module({
  providers: [
    { provide: HttpTransport, useClass: FetchHttpTransport },
    { provide: Sleeper, useClass: TimerSleeper },
  ],
  exports: [HttpTransport, Sleeper],
})
export class ConnectorRuntimeModule {}
