import { Module } from '@nestjs/common';
import { SandboxModule } from '@crossmart/core';
import { AuthModule } from '../auth/auth.module.js';
import { ThrottlingModule } from '../common/throttling/throttling.module.js';
import { SandboxAccountsController } from './controllers/sandbox-accounts.controller.js';
import { SandboxClaimsController } from './controllers/sandbox-claims.controller.js';
import { WorkspaceSandboxController } from './controllers/workspace-sandbox.controller.js';
import { SandboxThrottlerGuard } from './guards/sandbox-throttler.guard.js';

/** Sandbox accounts AI agents open, and claiming them (ADR 0019). */
@Module({
  imports: [AuthModule, SandboxModule, ThrottlingModule],
  controllers: [SandboxAccountsController, SandboxClaimsController, WorkspaceSandboxController],
  providers: [SandboxThrottlerGuard],
})
export class SandboxApiModule {}
