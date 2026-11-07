import { Module } from '@nestjs/common';
import { AskModule, TenancyModule } from '@crossmart/core';
import { PlatformAdminGuard } from '../auth/guards/platform-admin.guard.js';
import { ThrottlingModule } from '../common/throttling/throttling.module.js';
import { AskAdminController } from './controllers/ask-admin.controller.js';
import { AskEscalationsController } from './controllers/ask-escalations.controller.js';
import { AskController } from './controllers/ask.controller.js';
import { AskPollThrottlerGuard } from './guards/ask-poll-throttler.guard.js';
import { AskThrottlerGuard } from './guards/ask-throttler.guard.js';
import { AskCallerResolver } from './services/ask-caller.resolver.js';

/**
 * Ask Crossmart over HTTP: the public `/ask` and `/ask/escalations` endpoints, rate limited per
 * IP or caller, and the platform admins' view of what people ask.
 */
@Module({
  imports: [AskModule, TenancyModule, ThrottlingModule],
  controllers: [AskController, AskEscalationsController, AskAdminController],
  providers: [AskThrottlerGuard, AskPollThrottlerGuard, AskCallerResolver, PlatformAdminGuard],
  exports: [AskModule, AskCallerResolver, AskThrottlerGuard],
})
export class AskApiModule {}
