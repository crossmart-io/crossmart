import { Module } from '@nestjs/common';
import { AskModule } from '@crossmart/core';
import { ThrottlingModule } from '../common/throttling/throttling.module.js';
import { AskController } from './controllers/ask.controller.js';
import { AskThrottlerGuard } from './guards/ask-throttler.guard.js';

/** The public Ask Crossmart endpoint, rate limited per IP or caller. */
@Module({
  imports: [AskModule, ThrottlingModule],
  controllers: [AskController],
  providers: [AskThrottlerGuard],
})
export class AskApiModule {}
